import { format } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { ServiceUser } from '../@types/express'
import {
  ActivityCategory,
  ActivitySchedule,
  ActivityScheduleLite,
  Allocation,
  AttendanceUpdateRequest,
  LocationGroup,
  ScheduledActivity,
  ScheduledEvent,
  Activity,
  ActivityCreateRequest,
  PrisonPayBand,
  PrisonerScheduledEvents,
  Appointment,
  AppointmentCategorySummary,
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
  AppointmentOccurrenceSearchRequest,
  AllAttendance,
  ActivityUpdateRequest,
  AllocationUpdateRequest,
  AppointmentOccurrenceCancelRequest,
  BulkAppointmentsRequest,
  BulkAppointment,
  BulkAppointmentDetails,
  EventReviewSearchResults,
  PrisonerDeallocationRequest,
  DeallocationReasonCode,
  EventAcknowledgeRequest,
  WaitingListApplicationRequest,
  WaitingListApplicationUpdateRequest,
  ActivitySummary,
} from '../@types/activitiesAPI/types'
import { SessionCancellationRequest } from '../routes/activities/record-attendance/recordAttendanceRequests'
import { DeallocateFromActivityJourney } from '../routes/activities/deallocate-from-activity/journey'
import { formatDate } from '../utils/utils'
import SimpleDate from '../commonValidationTypes/simpleDate'

export default class ActivitiesService {
  constructor(private readonly activitiesApiClient: ActivitiesApiClient) {}

  getActivity(activityId: number, user: ServiceUser): Promise<Activity> {
    return this.activitiesApiClient.getActivity(activityId, user)
  }

  async getActivityCategories(user: ServiceUser): Promise<ActivityCategory[]> {
    return this.activitiesApiClient.getActivityCategories(user)
  }

  async getAttendanceReasons(user: ServiceUser): Promise<AttendanceReason[]> {
    return this.activitiesApiClient.getAttendanceReasons(user)
  }

  async getActivities(excludeArchived: boolean, user: ServiceUser): Promise<ActivitySummary[]> {
    return this.activitiesApiClient.getActivities(user.activeCaseLoadId, excludeArchived, user)
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

  updateActivity(prisonCode: string, activityId: number, updateBody: ActivityUpdateRequest) {
    return this.activitiesApiClient.patchActivityUpdate(prisonCode, activityId, updateBody)
  }

  updateAllocation(prisonCode: string, allocationId: number, updateBody: AllocationUpdateRequest) {
    return this.activitiesApiClient.patchAllocationUpdate(prisonCode, allocationId, updateBody)
  }

  allocateToSchedule(
    scheduleId: number,
    prisonerNumber: string,
    payBandId: number,
    user: ServiceUser,
    startDate: string,
    endDate: string,
  ): Promise<void> {
    return this.activitiesApiClient.postAllocation(scheduleId, prisonerNumber, payBandId, user, startDate, endDate)
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

  async getDefaultScheduleOfActivity(activity: Activity, user: ServiceUser): Promise<ActivityScheduleLite> {
    return this.getActivitySchedule(activity.schedules[0].id, user)
  }

  async getActivitySchedule(id: number, user: ServiceUser): Promise<ActivitySchedule> {
    return this.activitiesApiClient.getActivitySchedule(id, user)
  }

  async updateAttendances(attendanceUpdates: AttendanceUpdateRequest[], user: ServiceUser): Promise<void> {
    return this.activitiesApiClient.updateAttendances(attendanceUpdates, user)
  }

  async getLocationGroups(user: ServiceUser): Promise<LocationGroup[]> {
    const { activeCaseLoadId } = user
    return this.activitiesApiClient.getPrisonLocationGroups(activeCaseLoadId, user)
  }

  async getAllocations(id: number, user: ServiceUser): Promise<Allocation[]> {
    return this.activitiesApiClient.getAllocations(id, user)
  }

  async getAllocation(allocationId: number, user: ServiceUser): Promise<Allocation> {
    return this.activitiesApiClient.getAllocation(allocationId, user)
  }

  async getActivePrisonPrisonerAllocations(prisonerNumbers: string[], user: ServiceUser) {
    return this.activitiesApiClient.getPrisonerAllocations(user.activeCaseLoadId, prisonerNumbers, user)
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

  async getAttendanceDetails(attendanceId: number): Promise<Attendance> {
    return this.activitiesApiClient.getAttendanceDetails(attendanceId)
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

  getPrisonRolloutPlan(prisonCode: string) {
    return this.activitiesApiClient.getPrisonRolloutPlan(prisonCode)
  }

  async getAllAttendance(sessionDate: Date, user: ServiceUser): Promise<AllAttendance[]> {
    return this.activitiesApiClient.getAllAttendance(sessionDate, user)
  }

  async searchAppointmentOccurrences(
    prisonCode: string,
    searchRequest: AppointmentOccurrenceSearchRequest,
    user: ServiceUser,
  ) {
    return this.activitiesApiClient.searchAppointmentOccurrences(prisonCode, searchRequest, user)
  }

  async cancelAppointmentOccurrence(
    occurrenceId: number,
    cancelRequest: AppointmentOccurrenceCancelRequest,
    user: ServiceUser,
  ) {
    return this.activitiesApiClient.cancelAppointmentOccurrence(occurrenceId, cancelRequest, user)
  }

  async createBulkAppointment(appointment: BulkAppointmentsRequest, user: ServiceUser): Promise<BulkAppointment> {
    return this.activitiesApiClient.postCreateBulkAppointment(appointment, user)
  }

  async getBulkAppointmentDetails(bulkAppointmentId: number, user: ServiceUser): Promise<BulkAppointmentDetails> {
    return this.activitiesApiClient.getBulkAppointmentDetails(bulkAppointmentId, user)
  }

  async getChangeEvents(
    prisonCode: string,
    requestDate: string,
    page: number,
    pageSize: number,
    user: ServiceUser,
  ): Promise<EventReviewSearchResults> {
    return this.activitiesApiClient.getChangeEvents(prisonCode, requestDate, page, pageSize, user)
  }

  async acknowledgeChangeEvents(prisonCode: string, eventIds: number[], user: ServiceUser) {
    const request = { eventReviewIds: eventIds } as EventAcknowledgeRequest
    return this.activitiesApiClient.acknowledgeChangeEvents(prisonCode, request, user)
  }

  async getDeallocationReasons(user: ServiceUser) {
    return this.activitiesApiClient.getDeallocationReasons(user)
  }

  async deallocateFromActivity(deallocateJourney: DeallocateFromActivityJourney, user: ServiceUser) {
    const request: PrisonerDeallocationRequest = {
      prisonerNumbers: deallocateJourney.prisoners.map(p => p.prisonerNumber),
      reasonCode: deallocateJourney.deallocationReason as DeallocationReasonCode,
      endDate: formatDate(plainToInstance(SimpleDate, deallocateJourney.deallocationDate).toRichDate(), 'yyyy-MM-dd'),
    }
    return this.activitiesApiClient.deallocateFromActivity(deallocateJourney.scheduleId, request, user)
  }

  async allocationSuitability(scheduleId: number, prisonerNumber: string, user: ServiceUser) {
    return this.activitiesApiClient.allocationSuitability(scheduleId, prisonerNumber, user)
  }

  async logWaitlistApplication(waitlistApplicationRequest: WaitingListApplicationRequest, user: ServiceUser) {
    return this.activitiesApiClient.postWaitlistApplication(waitlistApplicationRequest, user)
  }

  async fetchActivityWaitlist(scheduleId: number, user: ServiceUser) {
    return this.activitiesApiClient.fetchActivityWaitlist(scheduleId, user)
  }

  async fetchWaitlistApplication(applicationId: number, user: ServiceUser) {
    return this.activitiesApiClient.fetchWaitlistApplication(applicationId, user)
  }

  async patchWaitlistApplication(
    applicationId: number,
    updateWaitlistRequest: WaitingListApplicationUpdateRequest,
    user: ServiceUser,
  ) {
    return this.activitiesApiClient.patchWaitlistApplication(applicationId, updateWaitlistRequest, user)
  }
}
