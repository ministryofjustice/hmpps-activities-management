import { format } from 'date-fns'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { ServiceUser } from '../@types/express'
import {
  ActivityCategory,
  ActivitySchedule,
  Allocation,
  AttendanceUpdateRequest,
  LocationGroup,
  ScheduledActivity,
  ScheduledEvent,
  Activity,
  ActivityCreateRequest,
  PrisonPayBand,
  PrisonerScheduledEvents,
  AppointmentSeries,
  AppointmentCategorySummary,
  AppointmentSeriesCreateRequest,
  AttendanceReason,
  AppointmentSeriesDetails,
  AppointmentDetails,
  ScheduleInstanceCancelRequest,
  UncancelScheduledInstanceRequest,
  Attendance,
  AppointmentUpdateRequest,
  PageActivityCandidate,
  AppointmentLocationSummary,
  AppointmentSearchRequest,
  AllAttendance,
  ActivityUpdateRequest,
  AllocationUpdateRequest,
  AppointmentCancelRequest,
  AppointmentSetCreateRequest,
  AppointmentSet,
  AppointmentSetDetails,
  EventReviewSearchResults,
  PrisonerDeallocationRequest,
  DeallocationReasonCode,
  EventAcknowledgeRequest,
  WaitingListApplicationRequest,
  WaitingListApplicationUpdateRequest,
  ActivitySummary,
  GetAllocationsParams,
  WaitingListSearchRequest,
  WaitingListSearchParams,
  Slot,
  AddCaseNoteRequest,
} from '../@types/activitiesAPI/types'
import { SessionCancellationRequest } from '../routes/activities/record-attendance/recordAttendanceRequests'
// import PrisonApiClient from '../data/prisonApiClient'

export default class ActivitiesService {
  constructor(
    private readonly activitiesApiClient: ActivitiesApiClient /* ,
              private readonly prisonApiClient: PrisonApiClient */,
  ) {}

  async getActivity(activityId: number, user: ServiceUser): Promise<Activity> {
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

  getCancelledScheduledActivitiesAtPrison(date: Date, user: ServiceUser): Promise<ScheduledActivity[]> {
    return this.activitiesApiClient.getScheduledActivitiesAtPrison(
      user.activeCaseLoadId,
      date,
      date,
      user,
      undefined,
      true,
    )
  }

  getScheduledActivity(id: number, user: ServiceUser): Promise<ScheduledActivity> {
    return this.activitiesApiClient.getScheduledActivity(id, user)
  }

  createActivity(createBody: ActivityCreateRequest, user: ServiceUser): Promise<Activity> {
    return this.activitiesApiClient.postActivityCreation(createBody, user)
  }

  updateActivity(activityId: number, updateBody: ActivityUpdateRequest, user: ServiceUser) {
    return this.activitiesApiClient.patchActivityUpdate(activityId, updateBody, user)
  }

  updateAllocation(allocationId: number, updateBody: AllocationUpdateRequest, user: ServiceUser) {
    return this.activitiesApiClient.patchAllocationUpdate(allocationId, updateBody, user)
  }

  suspendAllocations(
    prisonerNumber: string,
    allocationIds: number[],
    suspendFrom: string,
    suspensionCaseNote: AddCaseNoteRequest,
    user: ServiceUser,
  ) {
    const request = { prisonerNumber, allocationIds, suspendFrom, suspensionCaseNote }
    return this.activitiesApiClient.suspendAllocations(request, user)
  }

  unsuspendAllocations(prisonerNumber: string, allocationIds: number[], suspendUntil: string, user: ServiceUser) {
    const request = { prisonerNumber, allocationIds, suspendUntil }
    return this.activitiesApiClient.unsuspendAllocations(request, user)
  }

  allocateToSchedule(
    scheduleId: number,
    prisonerNumber: string,
    payBandId: number | null,
    user: ServiceUser,
    startDate: string,
    endDate: string,
    exclusions: Slot[],
  ): Promise<void> {
    return this.activitiesApiClient.postAllocation(
      scheduleId,
      prisonerNumber,
      payBandId,
      user,
      startDate,
      endDate,
      exclusions,
    )
  }

  getPayBandsForPrison(user: ServiceUser): Promise<PrisonPayBand[]> {
    return this.activitiesApiClient.getPayBandsForPrison(user.activeCaseLoadId, user)
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

  async getAllocationsWithParams(
    scheduledInstanceId: number,
    params: GetAllocationsParams,
    user: ServiceUser,
  ): Promise<Allocation[]> {
    return this.activitiesApiClient.getAllocationsWithParams(scheduledInstanceId, params, user)
  }

  async getAllocation(allocationId: number, user: ServiceUser): Promise<Allocation> {
    return this.activitiesApiClient.getAllocation(allocationId, user)
  }

  async getActivePrisonPrisonerAllocations(prisonerNumbers: string[], user: ServiceUser) {
    return this.activitiesApiClient.getPrisonerAllocations(user.activeCaseLoadId, prisonerNumbers, user)
  }

  async getAppointmentSeriesDetails(appointmentSeriesId: number, user: ServiceUser): Promise<AppointmentSeriesDetails> {
    return this.activitiesApiClient.getAppointmentSeriesDetails(appointmentSeriesId, user)
  }

  async getAppointmentDetails(appointmentId: number, user: ServiceUser): Promise<AppointmentDetails> {
    return this.activitiesApiClient.getAppointmentDetails(appointmentId, user)
  }

  async getAppointmentCategories(user: ServiceUser): Promise<AppointmentCategorySummary[]> {
    return this.activitiesApiClient.getAppointmentCategories(user)
  }

  async getAppointmentLocations(prisonCode: string, user: ServiceUser): Promise<AppointmentLocationSummary[]> {
    return this.activitiesApiClient.getAppointmentLocations(prisonCode, user)
  }

  createAppointmentSeries(request: AppointmentSeriesCreateRequest, user: ServiceUser): Promise<AppointmentSeries> {
    return this.activitiesApiClient.postCreateAppointmentSeries(request, user)
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
      displayName: user.displayName,
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

  async editAppointment(appointmentId: number, request: AppointmentUpdateRequest, user: ServiceUser) {
    return this.activitiesApiClient.patchUpdateAppointment(appointmentId, request, user)
  }

  getPrisonRolloutPlan(prisonCode: string) {
    return this.activitiesApiClient.getPrisonRolloutPlan(prisonCode)
  }

  getRolledOutPrisons() {
    return this.activitiesApiClient.getRolledOutPrisons()
  }

  async getAllAttendance(sessionDate: Date, user: ServiceUser): Promise<AllAttendance[]> {
    return this.activitiesApiClient.getAllAttendance(sessionDate, user)
  }

  async searchAppointments(prisonCode: string, request: AppointmentSearchRequest, user: ServiceUser) {
    return this.activitiesApiClient.searchAppointments(prisonCode, request, user)
  }

  async getAttendees(scheduledInstanceId: number, user: ServiceUser) {
    return this.activitiesApiClient.getAttendees(scheduledInstanceId, user)
  }

  async getScheduledInstanceAttendanceSummary(prisonCode: string, sessionDate: Date, user: ServiceUser) {
    return this.activitiesApiClient.getScheduledInstanceAttendanceSummary(prisonCode, sessionDate, user)
  }

  async cancelAppointment(appointmentId: number, request: AppointmentCancelRequest, user: ServiceUser) {
    return this.activitiesApiClient.cancelAppointments(appointmentId, request, user)
  }

  async createAppointmentSet(request: AppointmentSetCreateRequest, user: ServiceUser): Promise<AppointmentSet> {
    return this.activitiesApiClient.postCreateAppointmentSet(request, user)
  }

  async getAppointmentSetDetails(appointmentSetId: number, user: ServiceUser): Promise<AppointmentSetDetails> {
    return this.activitiesApiClient.getAppointmentSetDetails(appointmentSetId, user)
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

  async deallocateFromActivity(
    scheduleId: number,
    prisonerNumbers: string[],
    reasonCode: DeallocationReasonCode,
    caseNote: AddCaseNoteRequest,
    endDate: string,
    user: ServiceUser,
  ) {
    const request: PrisonerDeallocationRequest = { prisonerNumbers, reasonCode, caseNote, endDate }
    return this.activitiesApiClient.deallocateFromActivity(scheduleId, request, user)
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

  async getInternalLocationEventsSummaries(prisonCode: string, date: Date, user: ServiceUser, timeSlot?: string) {
    return this.activitiesApiClient.getInternalLocationEventsSummaries(
      prisonCode,
      format(date, 'yyyy-MM-dd'),
      user,
      timeSlot,
    )
  }

  /*
    break these three calls into a new service, scheduled event service
  */

  //  this calls scheduled events controller
  async getInternalLocationEvents(
    prisonCode: string,
    date: Date,
    internalLocationIds: number[],
    user: ServiceUser,
    timeSlot?: string,
  ) {
    // merge in other events
    return this.activitiesApiClient.getInternalLocationEvents(
      prisonCode,
      format(date, 'yyyy-MM-dd'),
      internalLocationIds,
      user,
      timeSlot,
    )
  }

  //  this calls scheduled events controller
  getScheduledEvents(
    prisonerNumber: string,
    startDate: Date,
    endDate: Date,
    user: ServiceUser,
  ): Promise<ScheduledEvent[]> {
    // merge in other events
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

  //  this calls scheduled events controller
  getScheduledEventsForPrisoners(
    date: Date,
    prisonerNumbers: string[],
    user: ServiceUser,
  ): Promise<PrisonerScheduledEvents> {
    // merge in other events
    return this.activitiesApiClient.getScheduledEventsByPrisonerNumbers(
      user.activeCaseLoadId,
      format(date, 'yyyy-MM-dd'),
      prisonerNumbers,
      user,
    )
  }

  // these are the other events to get, transform to ScheduledEvent, then merge into responses.
  /* getOtherScheduledEvents(): {
    return Promise.all(
      transfers
      visits
      /court hearings
      adjudications
    ).map(transformTo ==> ScheduledEvent)
  }
  */

  async getAppointmentAttendanceSummaries(prisonCode: string, date: Date, user: ServiceUser) {
    return this.activitiesApiClient.getAppointmentAttendanceSummaries(prisonCode, format(date, 'yyyy-MM-dd'), user)
  }

  async markAppointmentAttendance(
    appointmentId: number,
    attendedPrisonNumbers: string[],
    nonAttendedPrisonNumbers: string[],
    user: ServiceUser,
  ) {
    return this.activitiesApiClient.putAppointmentAttendance(
      appointmentId,
      { attendedPrisonNumbers, nonAttendedPrisonNumbers },
      user,
    )
  }

  async searchWaitingListApplications(
    prisonCode: string,
    searchRequest: WaitingListSearchRequest,
    pageOptions: WaitingListSearchParams,
    user: ServiceUser,
  ) {
    return this.activitiesApiClient.searchWaitingListApplications(prisonCode, searchRequest, pageOptions, user)
  }

  async activeRolledPrisons(): Promise<string[]> {
    const r = await this.getRolledOutPrisons()
    return r.filter(item => item.activitiesRolledOut || item.appointmentsRolledOut).map(item => item.prisonCode)
  }
}
