import { format } from 'date-fns'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
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
  PrisonPayBand,
  PrisonerScheduledEvents,
  Appointment,
  AppointmentCategorySummary,
  LocationPrefix,
  AppointmentCreateRequest,
  AttendanceReason,
  AppointmentDetails,
  AppointmentOccurrenceDetails,
  ScheduleInstanceCancelRequest,
  UncancelScheduledInstanceRequest,
  Attendance,
  AppointmentOccurrenceUpdateRequest,
  PageActivityCandidate,
  AppointmentLocationSummary,
} from '../@types/activitiesAPI/types'
import { SanitisedError } from '../sanitisedError'
import { CaseLoadExtended } from '../@types/dps'
import { ActivityScheduleAllocation } from '../@types/activities'
import { SessionCancellationRequest } from '../routes/record-attendance/recordAttendanceRequests'

const processError = (error: SanitisedError): undefined => {
  if (!error.status) throw error
  if (error.status !== 404) throw error // Not Found
  return undefined
}

export default class ActivitiesService {
  constructor(
    private readonly activitiesApiClient: ActivitiesApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
  ) {}

  getActivity(activityId: number, user: ServiceUser): Promise<Activity> {
    return this.activitiesApiClient.getActivity(activityId, user)
  }

  async getActivityCategories(user: ServiceUser): Promise<ActivityCategory[]> {
    return this.activitiesApiClient.getActivityCategories(user)
  }

  async getAttendanceReasons(user: ServiceUser): Promise<AttendanceReason[]> {
    return this.activitiesApiClient.getAttendanceReasons(user)
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

  createActivity(createBody: ActivityCreateRequest, user: ServiceUser): Promise<Activity> {
    return this.activitiesApiClient.postActivityCreation(createBody, user)
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
      .then(res => [
        ...res.activities,
        ...res.courtHearings,
        ...res.appointments,
        ...res.visits,
        ...res.externalTransfers,
        ...res.adjudications,
      ])
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
        cle.isAppointmentsEnabled = match.isAppointmentsEnabled
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

  async getDefaultScheduleOfActivity(activity: Activity, user: ServiceUser): Promise<ActivityScheduleLite> {
    return this.getActivitySchedule(activity.schedules[0].id, user)
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
    return this.activitiesApiClient.getAppointmentDetails(appointmentId, user)
  }

  async getAppointmentOccurrenceDetails(
    appointmentOccurrenceId: number,
    user: ServiceUser,
  ): Promise<AppointmentOccurrenceDetails> {
    return this.activitiesApiClient.getAppointmentOccurrenceDetails(appointmentOccurrenceId, user)
  }

  async getAppointmentCategories(user: ServiceUser): Promise<AppointmentCategorySummary[]> {
    return this.activitiesApiClient.getAppointmentCategories(user)
  }

  async getAppointmentLocations(prisonCode: string, user: ServiceUser): Promise<AppointmentLocationSummary[]> {
    return this.activitiesApiClient.getAppointmentLocations(prisonCode, user)
  }

  createAppointment(appointment: AppointmentCreateRequest, user: ServiceUser): Promise<Appointment> {
    return this.activitiesApiClient.postCreateAppointment(appointment, user)
  }

  async cancelScheduledActivity(
    scheduleInstanceId: number,
    cancelRequest: SessionCancellationRequest,
    user: ServiceUser,
  ) {
    const scheduleInstanceCancelRequest: ScheduleInstanceCancelRequest = {
      ...cancelRequest,
      username: user.username,
    }
    return this.activitiesApiClient.putCancelScheduledActivity(scheduleInstanceId, scheduleInstanceCancelRequest, user)
  }

  async uncancelScheduledActivity(scheduleInstanceId: number, user: ServiceUser) {
    const uncancelScheduledInstanceRequest: UncancelScheduledInstanceRequest = {
      username: user.username,
      displayName: `${user.firstName} ${user.lastName}`,
    }
    return this.activitiesApiClient.putUncancelScheduledActivity(
      scheduleInstanceId,
      uncancelScheduledInstanceRequest,
      user,
    )
  }

  async getAttendanceDetails(attendanceId: number, user: ServiceUser): Promise<Attendance> {
    return this.activitiesApiClient.getAttendanceDetails(attendanceId, user)
  }

  getActivityCandidates(
    scheduleInstanceId: number,
    user: ServiceUser,
    suitableIeps?: string[],
    suitableRiskLevels?: string[],
    suitableForEmployed?: boolean,
    searchQuery?: string,
    page?: number,
  ): Promise<PageActivityCandidate> {
    return this.activitiesApiClient.getActivityCandidates(
      scheduleInstanceId,
      user,
      suitableIeps,
      suitableRiskLevels,
      suitableForEmployed,
      searchQuery,
      page,
    )
  }

  async editAppointmentOccurrence(
    occurrenceId: number,
    occurrenceUpdates: AppointmentOccurrenceUpdateRequest,
    user: ServiceUser,
  ) {
    return this.activitiesApiClient.editAppointmentOccurrence(occurrenceId, occurrenceUpdates, user)
  }
}
