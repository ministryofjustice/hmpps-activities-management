import { format } from 'date-fns'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import PrisonApiClient from '../data/prisonApiClient'
import { ServiceUser } from '../@types/express'
import {
  ActivityCategory,
  ActivityLite,
  ActivitySchedule,
  ActivityScheduleLite,
  Allocation,
  AttendanceUpdateRequest,
  InternalLocation,
  LocationGroup,
  RolloutPrison,
  ScheduledActivity,
  ScheduledEvent,
  PrisonerAllocations,
  Activity,
  ActivityCreateRequest,
  ActivityScheduleCreateRequest,
  PrisonPayBand,
  PrisonerScheduledEvents,
  Appointment,
  AppointmentCategory,
  LocationPrefix,
  AppointmentCreateRequest,
} from '../@types/activitiesAPI/types'
import { SanitisedError } from '../sanitisedError'
import { CaseLoadExtended } from '../@types/dps'
import { ActivityScheduleAllocation } from '../@types/activities'
import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'
import { AppointmentDetails, AppointmentOccurrenceSummary } from '../@types/appointments'
import { LocationLenient } from '../@types/prisonApiImportCustom'
import logger from '../../logger'

const processError = (error: SanitisedError): undefined => {
  if (!error.status) throw error
  if (error.status !== 404) throw error // Not Found
  return undefined
}

export default class ActivitiesService {
  constructor(
    private readonly activitiesApiClient: ActivitiesApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
    private readonly prisonApiClient: PrisonApiClient,
  ) {}

  getActivity(activityId: number, user: ServiceUser): Promise<Activity> {
    return this.activitiesApiClient.getActivity(activityId, user)
  }

  async getActivityCategories(user: ServiceUser): Promise<ActivityCategory[]> {
    return this.activitiesApiClient.getActivityCategories(user)
  }

  async getActivities(user: ServiceUser): Promise<ActivityLite[]> {
    return this.activitiesApiClient.getActivities(user.activeCaseLoadId, user)
  }

  async getActivitiesInCategory(categoryId: number, user: ServiceUser): Promise<ActivityLite[]> {
    return this.activitiesApiClient.getActivitiesInCategory(user.activeCaseLoadId, categoryId, user)
  }

  async getSchedulesOfActivity(activityId: number, user: ServiceUser): Promise<ActivityScheduleLite[]> {
    return this.activitiesApiClient.getSchedulesOfActivity(activityId, user)
  }

  getScheduledActivitiesAtPrison(date: Date, user: ServiceUser): Promise<ScheduledActivity[]> {
    return this.activitiesApiClient.getScheduledActivitiesAtPrison(user.activeCaseLoadId, date, date, user)
  }

  getScheduledActivity(id: number, user: ServiceUser): Promise<ScheduledActivity> {
    return this.activitiesApiClient.getScheduledActivity(id, user)
  }

  createActivity(createBody: ActivityCreateRequest, user: ServiceUser): Promise<ActivityLite> {
    return this.activitiesApiClient.postActivityCreation(createBody, user)
  }

  createScheduleActivity(
    activityId: number,
    createBody: ActivityScheduleCreateRequest,
    user: ServiceUser,
  ): Promise<ActivityScheduleLite> {
    return this.activitiesApiClient.postActivityScheduleCreation(activityId, createBody, user)
  }

  allocateToSchedule(scheduleId: number, prisonerNumber: string, payBandId: number, user: ServiceUser): Promise<void> {
    return this.activitiesApiClient.postAllocation(scheduleId, prisonerNumber, payBandId, user)
  }

  getPayBandsForPrison(user: ServiceUser): Promise<PrisonPayBand[]> {
    return this.activitiesApiClient.getPayBandsForPrison(user.activeCaseLoadId, user)
  }

  getScheduledEvents(
    prisonerNumber: string,
    startDate: Date,
    endDate: Date,
    user: ServiceUser,
  ): Promise<ScheduledEvent[]> {
    return this.activitiesApiClient
      .getScheduledEvents(
        user.activeCaseLoadId,
        prisonerNumber,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd'),
        user,
      )
      .then(res => [...res.activities, ...res.courtHearings, ...res.appointments, ...res.visits])
  }

  async populateUserPrisonInfo(user: ServiceUser) {
    const prisonInfoCalls: Promise<RolloutPrison | undefined>[] = []
    user.allCaseLoads.forEach(cl => {
      prisonInfoCalls.push(this.getPrison(cl.caseLoadId, user))
    })
    const responses: RolloutPrison[] = await Promise.all(prisonInfoCalls)
    const results = responses.filter(elem => elem !== undefined)
    const userCaseLoads: CaseLoadExtended[] = []
    const newUser = { ...user }
    user.allCaseLoads.forEach(cl => {
      const match = results.find(r => r.code === cl.caseLoadId)
      if (match) {
        const cle = cl as CaseLoadExtended
        cle.isRolledOut = match.active
        userCaseLoads.push(cle)
        if (cle.caseLoadId === user.activeCaseLoadId) {
          newUser.activeCaseLoad = cle
        }
      } else {
        userCaseLoads.push(cl)
      }
    })
    newUser.allCaseLoads = userCaseLoads
    return newUser
  }

  async getPrison(prisonCode: string, user: ServiceUser): Promise<RolloutPrison | undefined> {
    return this.activitiesApiClient.getRolloutPrison(prisonCode, user).catch(processError)
  }

  async getScheduledPrisonLocations(
    prisonCode: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<InternalLocation[]> {
    return this.activitiesApiClient.getScheduledPrisonLocations(prisonCode, date, period, user)
  }

  getScheduledEventsForPrisoners(
    date: Date,
    prisonerNumbers: string[],
    user: ServiceUser,
  ): Promise<PrisonerScheduledEvents> {
    return this.activitiesApiClient.getScheduledEventsByPrisonerNumbers(
      user.activeCaseLoadId,
      format(date, 'yyyy-MM-dd'),
      prisonerNumbers,
      user,
    )
  }

  async getActivitySchedule(id: number, user: ServiceUser): Promise<ActivitySchedule> {
    return this.activitiesApiClient.getActivitySchedule(id, user)
  }

  async getActivitySchedules(
    prisonCode: string,
    locationId: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<ActivityScheduleAllocation[]> {
    const activitySchedules = await this.activitiesApiClient.getActivitySchedules(
      prisonCode,
      locationId,
      date,
      period,
      user,
    )

    // We'd like to assume there would be only one activity schedule returned - but we cant at this stage
    const prisonerNumbers: string[] = activitySchedules
      .map(as => {
        if (as.instances.length === 1) {
          // We wouldn't be able to cope with multiple instances
          return as.allocations.map(alloc => alloc.prisonerNumber)
        }
        return []
      })
      .flat()

    const prisoners = await this.prisonerSearchApiClient.searchByPrisonerNumbers({ prisonerNumbers }, user)

    return activitySchedules
      .map(as => {
        if (as.instances.length === 1) {
          // We wouldn't be able to cope with multiple instances
          return as.allocations.map(alloc => {
            return {
              activityScheduleId: as.id,
              description: as.description,
              internalLocation: as.internalLocation,
              prisoner: prisoners.find(p => p.prisonerNumber === alloc.prisonerNumber),
              attendance: as.instances[0].attendances.find(a => a.prisonerNumber === alloc.prisonerNumber),
            }
          })
        }
        return []
      })
      .flat()
  }

  async updateAttendances(attendanceUpdates: AttendanceUpdateRequest[], user: ServiceUser): Promise<void> {
    return this.activitiesApiClient.updateAttendances(attendanceUpdates, user)
  }

  // TODO: Test case
  async getLocationPrefix(loc: string, user: ServiceUser): Promise<LocationPrefix> {
    const { activeCaseLoadId } = user
    return this.activitiesApiClient.getPrisonLocationPrefixByGroup(activeCaseLoadId, loc, user)
  }

  async getLocationGroups(user: ServiceUser): Promise<LocationGroup[]> {
    const { activeCaseLoadId } = user
    return this.activitiesApiClient.getPrisonLocationGroups(activeCaseLoadId, user)
  }

  async getAllocations(id: number, user: ServiceUser): Promise<Allocation[]> {
    return this.activitiesApiClient.getAllocations(id, user)
  }

  async getPrisonerAllocations(
    prisonCode: string,
    prisonerNumbers: string[],
    user: ServiceUser,
  ): Promise<PrisonerAllocations[]> {
    if (prisonerNumbers.length < 1) {
      return []
    }
    return this.activitiesApiClient.getPrisonerAllocations(prisonCode, prisonerNumbers, user)
  }

  async getAppointment(appointmentId: number, user: ServiceUser): Promise<Appointment> {
    return this.activitiesApiClient.getAppointment(appointmentId, user)
  }

  async getAppointmentDetails(appointmentId: number, user: ServiceUser): Promise<AppointmentDetails> {
    const appointment = await this.getAppointment(appointmentId, user)

    const locationsMap = (
      await this.prisonApiClient.getLocationsForEventType(appointment.prisonCode, 'APP', user)
    ).reduce((map, location) => {
      return map.set(location.locationId, location)
    }, new Map<number, LocationLenient>())

    const occurrenceSummaries = appointment.occurrences.map(occurrence => {
      return {
        id: occurrence.id,
        internalLocation: locationsMap.get(occurrence.internalLocationId),
        inCell: occurrence.inCell,
        startDate: new Date(occurrence.startDate),
        startTime: new Date(`${occurrence.startDate}T${occurrence.startTime}:00`),
        endTime: occurrence.endTime !== null ? new Date(`${occurrence.startDate}T${occurrence.endTime}:00`) : null,
        comment: occurrence.comment,
        isCancelled: false,
        updated: null,
        updatedBy: null,
        isEdited: false,
      } as AppointmentOccurrenceSummary
    })

    const prisonerNumbers = appointment.occurrences
      .map(occurrence =>
        occurrence.allocations.map(allocation => {
          return allocation.prisonerNumber
        }),
      )
      .flat()
    const prisoners = await this.prisonerSearchApiClient.searchByPrisonerNumbers({ prisonerNumbers }, user)
    const prisonerMap = prisoners.reduce((map, prisoner) => {
      return map.set(prisoner.prisonerNumber, prisoner)
    }, new Map<string, Prisoner>())

    let createdBy = null
    try {
      const createdByUserDetail = await this.prisonApiClient.getUserByUsername(appointment.createdBy, user)
      createdBy = `${createdByUserDetail.firstName} ${createdByUserDetail.lastName}`
    } catch (e) {
      // If the username isn't found, log the error and continue
      if (e.status === 404) {
        logger.info(`Couldn't get user with username, ${appointment.createdBy}`)
      } else {
        throw e
      }
    }

    let updatedBy = null
    if (appointment.createdBy === appointment.updatedBy) {
      updatedBy = createdBy
    } else if (appointment.updatedBy !== null) {
      const updatedByUserDetail = await this.prisonApiClient.getUserByUsername(appointment.updatedBy, user)
      updatedBy = `${updatedByUserDetail.firstName} ${updatedByUserDetail.lastName}`
    }

    return {
      id: appointment.id,
      category: appointment.category,
      internalLocation: locationsMap.get(appointment.internalLocationId),
      inCell: appointment.inCell,
      startDate: new Date(appointment.startDate),
      startTime: new Date(`${appointment.startDate}T${appointment.startTime}:00`),
      endTime: appointment.endTime !== null ? new Date(`${appointment.startDate}T${appointment.endTime}:00`) : null,
      comment: appointment.comment,
      created: new Date(appointment.created),
      createdBy,
      updated: appointment.updated !== null ? new Date(appointment.updated) : null,
      updatedBy,
      occurrences: occurrenceSummaries,
      prisoners,
      prisonerMap,
    }
  }

  async getAppointmentCategories(user: ServiceUser): Promise<AppointmentCategory[]> {
    return this.activitiesApiClient.getAppointmentCategories(user)
  }

  createAppointment(appointment: AppointmentCreateRequest, user: ServiceUser): Promise<Appointment> {
    return this.activitiesApiClient.postCreateAppointment(appointment, user)
  }
}
