import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import { InmateDetail, ScheduledAppointmentDto, InmateBasicDetails } from '../@types/prisonApiImport/types'
import { PagePrisoner, Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'
import WhereaboutsApiClient from '../data/whereaboutsApiClient'
import {
  getOffenderCourtEvents,
  offenderNumberMultiMap,
  isReleaseScheduled,
  getScheduledTransfers,
  selectAlertFlags,
  selectCategory,
  sortActivitiesByEventThenByLastName,
  extractAttendanceInfo,
} from './prisonServiceHelper'
import { sortByDateTime } from '../utils/utils'
import {
  AttendanceDto,
  AttendancesResponse,
  CreateAttendanceDto,
  UpdateAttendanceDto,
} from '../@types/whereaboutsApiImport/types'
import { LocationLenient } from '../@types/prisonApiImportCustom'
import { ActivityByLocation, OffenderActivityId, OffenderData } from '../@types/dps'
import logger from '../../logger'
import {
  AbsentReasonsDtoLenient,
  CreateAttendanceDtoLenient,
  UpdateAttendanceDtoLenient,
} from '../@types/whereaboutsApiImportCustom'
import IncentivesApiClient from '../data/incentivesApiClient'
import { IepLevel, IepSummary } from '../@types/incentivesApi/types'

export default class PrisonService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
    private readonly whereaboutsApiClient: WhereaboutsApiClient,
    private readonly incentivesApiClient: IncentivesApiClient,
  ) {}

  async getInmate(nomisId: string, user: ServiceUser): Promise<InmateDetail> {
    return this.prisonApiClient.getInmateDetail(nomisId, user)
  }

  async getInmates(prisonCode: string, user: ServiceUser, includeRestricted?: boolean): Promise<PagePrisoner> {
    return this.prisonerSearchApiClient.getInmates(prisonCode, 0, 1000, user, includeRestricted)
  }

  getIncentiveLevels(prisonId: string, user: ServiceUser): Promise<IepLevel[]> {
    return this.incentivesApiClient.getIncentiveLevels(prisonId, user)
  }

  getPrisonerIepSummary(prisonerNumber: string, user: ServiceUser): Promise<IepSummary> {
    return this.incentivesApiClient.getPrisonerIepSummary(prisonerNumber, user)
  }

  async searchInmates(prisonerSearchCriteria: PrisonerSearchCriteria, user: ServiceUser): Promise<Prisoner[]> {
    return this.prisonerSearchApiClient.searchInmates(prisonerSearchCriteria, user)
  }

  async getEventLocations(prisonCode: string, user: ServiceUser): Promise<LocationLenient[]> {
    return this.prisonApiClient.getEventLocations(prisonCode, user)
  }

  async searchActivityLocations(
    prisonCode: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<LocationLenient[]> {
    return this.prisonApiClient.searchActivityLocations(prisonCode, date, period, user)
  }

  async searchActivities(
    prisonId: string,
    locationId: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<ActivityByLocation[]> {
    // Seems like these 3 calls are only used to get a list of offender numbers which are then used by subsequent calls
    const eventsAtLocationByUsage = await Promise.all([
      this.prisonApiClient.getActivitiesAtLocation(locationId, date, period, true, user),
      this.prisonApiClient.getActivityList(prisonId, locationId, date, period, 'VISIT', user),
      this.prisonApiClient.getActivityList(prisonId, locationId, date, period, 'APP', user),
    ])

    const eventsAtLocation = [
      ...eventsAtLocationByUsage[0],
      ...eventsAtLocationByUsage[1],
      ...eventsAtLocationByUsage[2],
    ]

    const offenderNumbersWithDuplicates = eventsAtLocation.map(event => event.offenderNo)
    const offenderNumbers = [...new Set(offenderNumbersWithDuplicates)]

    const attendanceInformation: AttendancesResponse = await this.whereaboutsApiClient.getAttendance(
      prisonId,
      locationId,
      date,
      period,
      user,
    )

    const [releaseScheduleData, courtEventData, transferData, alertData, assessmentData] = await Promise.all([
      this.prisonApiClient.getSentenceData(offenderNumbers, user),
      this.prisonApiClient.getCourtEvents(prisonId, date, offenderNumbers, user),
      this.prisonApiClient.getExternalTransfers(prisonId, date, offenderNumbers, user),
      this.prisonApiClient.getAlerts(prisonId, offenderNumbers, user),
      this.prisonApiClient.getAssessments('CATEGORY', offenderNumbers, user),
    ])

    const externalEventsForOffenderNumbers: Map<string, OffenderData> = offenderNumbers.reduce(
      (map, offenderNumber) => {
        const offenderData: OffenderData = {
          releaseScheduled: isReleaseScheduled(releaseScheduleData, offenderNumber, date),
          courtEvents: getOffenderCourtEvents(courtEventData, offenderNumber, date),
          scheduledTransfers: getScheduledTransfers(transferData, offenderNumber, date),
          alertFlags: selectAlertFlags(alertData, offenderNumber),
          category: selectCategory(assessmentData, offenderNumber),
        }
        return map.set(offenderNumber, offenderData)
      },
      new Map(),
    )

    const eventsForOffenderNumbersResults: ScheduledAppointmentDto[][] = await Promise.all([
      this.prisonApiClient.getVisits(prisonId, date, period, offenderNumbers, user),
      this.prisonApiClient.getAppointments(prisonId, date, period, offenderNumbers, user),
      this.prisonApiClient.getActivities(prisonId, date, period, offenderNumbers, user),
    ])

    const eventsForOffenderNumbers = [
      ...eventsForOffenderNumbersResults[0],
      ...eventsForOffenderNumbersResults[1],
      ...eventsForOffenderNumbersResults[2],
    ]

    const eventsElsewhere = eventsForOffenderNumbers.filter(event => event.locationId !== +locationId)
    const eventsElsewhereByOffenderNumber = offenderNumberMultiMap(offenderNumbers)

    eventsElsewhere.forEach(event => {
      const events = eventsElsewhereByOffenderNumber.get(event.offenderNo)
      if (events) events.push(event)
    })

    const events = eventsAtLocation.map(event => {
      const { releaseScheduled, courtEvents, scheduledTransfers, alertFlags, category } =
        externalEventsForOffenderNumbers.get(event.offenderNo)

      const eventsElsewhereForOffender = eventsElsewhereByOffenderNumber
        .get(event.offenderNo)
        .sort((left: { startTime: string }, right: { startTime: string }) =>
          sortByDateTime(left.startTime, right.startTime),
        )
      const attendanceInfo = extractAttendanceInfo(attendanceInformation, event)

      return {
        ...event,
        eventsElsewhere: eventsElsewhereForOffender,
        releaseScheduled,
        courtEvents,
        scheduledTransfers,
        alertFlags,
        category,
        attendanceInfo,
      }
    })

    sortActivitiesByEventThenByLastName(events)

    return events
  }

  async createUpdateAttendance(
    id: number,
    eventDate: string,
    attendance: CreateAttendanceDtoLenient | UpdateAttendanceDtoLenient,
    user: ServiceUser,
  ): Promise<AttendanceDto> {
    let response
    if (id) {
      response = await this.whereaboutsApiClient.updateAttendance(
        id,
        eventDate,
        attendance as UpdateAttendanceDto,
        user,
      )
      logger.info({}, 'updateAttendance success')
    } else {
      response = await this.whereaboutsApiClient.createAttendance(eventDate, attendance as CreateAttendanceDto, user)
      logger.info({}, 'createAttendance success')
    }
    return response
  }

  async batchUpdateAttendance(
    prisonId: string,
    locationId: string,
    date: string,
    period: string,
    activities: OffenderActivityId[],
    attended: boolean,
    paid: boolean,
    reason: string,
    comments: string,
    user: ServiceUser,
  ): Promise<AttendancesResponse> {
    return this.whereaboutsApiClient.batchUpdateAttendance(
      prisonId,
      locationId,
      date,
      period,
      activities,
      attended,
      paid,
      reason,
      comments,
      user,
    )
  }

  async getAbsenceReasons(user: ServiceUser): Promise<AbsentReasonsDtoLenient> {
    return this.whereaboutsApiClient.getAbsenceReasons(user)
  }

  async getInmateDetails(offenderNumbers: string[], user: ServiceUser): Promise<InmateBasicDetails[]> {
    return this.prisonApiClient.getInmateDetails(offenderNumbers, user)
  }
}
