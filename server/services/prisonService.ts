import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import { Prison } from '../@types/prisonRegisterApiImport/types'
import { InmateDetail, ScheduledAppointmentDto } from '../@types/prisonApiImport/types'
import { Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearchImport/types'
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
} from './prisonServiceHelpers'
import { sortByDateTime } from '../utils/utils'
import { AttendancesResponse } from '../@types/whereaboutsApiImport/types'
import { LocationLenient } from '../types/prisonApiImport'
import { ActivityByLocation, OffenderData } from '../types/dps'

export default class PrisonService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
    private readonly prisonRegisterApiClient: PrisonRegisterApiClient,
    private readonly whereaboutsApiClient: WhereaboutsApiClient,
  ) {}

  async getPrison(prisonCode: string, user: ServiceUser): Promise<Prison> {
    return this.prisonRegisterApiClient.getPrison(prisonCode, user)
  }

  async getInmate(nomisId: string, user: ServiceUser): Promise<InmateDetail> {
    return this.prisonApiClient.getInmateDetail(nomisId, user)
  }

  async searchInmates(prisonerSearchCriteria: PrisonerSearchCriteria, user: ServiceUser): Promise<Prisoner[]> {
    return this.prisonerSearchApiClient.searchInmates(prisonerSearchCriteria, user)
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
}
