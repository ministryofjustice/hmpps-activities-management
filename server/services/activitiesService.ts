import { format } from 'date-fns'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { ServiceUser } from '../@types/express'
import {
  Activity,
  ActivityCategory,
  ActivityCreateRequest,
  ActivitySchedule,
  ActivitySummary,
  ActivityUpdateRequest,
  AddCaseNoteRequest,
  AllAttendance,
  Allocation,
  AllocationUpdateRequest,
  AppointmentAttendeeByStatus,
  AppointmentCancelRequest,
  AppointmentCategorySummary,
  AppointmentCountSummary,
  AppointmentDetails,
  AppointmentLocationSummary,
  AppointmentSearchRequest,
  AppointmentSeries,
  AppointmentSeriesCreateRequest,
  AppointmentSeriesDetails,
  AppointmentSet,
  AppointmentSetCreateRequest,
  AppointmentSetDetails,
  AppointmentUncancelRequest,
  AppointmentUpdateRequest,
  Attendance,
  AttendanceReason,
  AttendanceUpdateRequest,
  DeallocationReasonCode,
  EventAcknowledgeRequest,
  EventReviewSearchResults,
  GetAllocationsParams,
  LocationGroup,
  MultipleAppointmentAttendanceRequest,
  NonAssociationDetails,
  PageActivityCandidate,
  PrisonerDeallocationRequest,
  PrisonerScheduledEvents,
  PrisonPayBand,
  PrisonPayBandCreateRequest,
  PrisonPayBandUpdateRequest,
  PrisonRegime,
  ScheduledActivity,
  ScheduledEvent,
  ScheduleInstanceCancelRequest,
  ScheduleInstancesCancelRequest,
  Slot,
  SuspendedPrisonerAttendance,
  SuspendPrisonerRequest,
  UncancelScheduledInstanceRequest,
  WaitingListApplicationRequest,
  WaitingListApplicationUpdateRequest,
  WaitingListSearchParams,
  WaitingListSearchRequest,
} from '../@types/activitiesAPI/types'
import { ActivityCategoryEnum } from '../data/activityCategoryEnum'
import {
  MultipleSessionCancellationRequest,
  SessionCancellationRequest,
} from '../routes/activities/record-attendance/journey'
import { AttendanceStatus } from '../@types/appointments'
import EventTier from '../enum/eventTiers'
import EventOrganiser from '../enum/eventOrganisers'
import { PrisonerSuspensionStatus } from '../routes/activities/manage-allocations/journey'
import AttendanceAction from '../enum/attendanceAction'

export default class ActivitiesService {
  constructor(private readonly activitiesApiClient: ActivitiesApiClient) {}

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

  getSuspendedPrisonersActivityAttendance(
    date: Date,
    user: ServiceUser,
    categories?: ActivityCategoryEnum[],
    reason?: string,
  ): Promise<SuspendedPrisonerAttendance[]> {
    return this.activitiesApiClient.getSuspendedPrisonersActivityAttendance(
      user.activeCaseLoadId,
      date,
      user,
      categories,
      reason,
    )
  }

  getScheduledActivity(id: number, user: ServiceUser): Promise<ScheduledActivity> {
    return this.activitiesApiClient.getScheduledActivity(id, user)
  }

  getScheduledActivities(ids: number[], user: ServiceUser): Promise<ScheduledActivity[]> {
    return this.activitiesApiClient.getScheduledActivities(ids, user)
  }

  getPrisonRegime(prisonCode: string, user: ServiceUser): Promise<PrisonRegime[]> {
    return this.activitiesApiClient.getPrisonRegime(prisonCode, user)
  }

  updatePrisonRegime(regimeSchedule: PrisonRegime[], prisonCode: string, user: ServiceUser): Promise<void> {
    return this.activitiesApiClient.updatePrisonRegime(regimeSchedule, prisonCode, user)
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
    status: PrisonerSuspensionStatus,
    suspensionCaseNote: AddCaseNoteRequest,
    user: ServiceUser,
  ) {
    const request: SuspendPrisonerRequest = { prisonerNumber, allocationIds, suspendFrom, suspensionCaseNote, status }
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
    scheduleInstanceId?: number,
  ): Promise<void> {
    return this.activitiesApiClient.postAllocation(
      scheduleId,
      prisonerNumber,
      payBandId,
      user,
      startDate,
      endDate,
      exclusions,
      scheduleInstanceId,
    )
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

  async getAppointments(appointmentIds: number[], user: ServiceUser): Promise<AppointmentDetails[]> {
    return this.activitiesApiClient.getAppointments(appointmentIds, user)
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
    noAllocations?: boolean,
    searchQuery?: string,
    page?: number,
  ): Promise<PageActivityCandidate> {
    return this.activitiesApiClient.getActivityCandidates(
      scheduleInstanceId,
      user,
      suitableIeps,
      suitableRiskLevels,
      suitableForEmployed,
      noAllocations,
      searchQuery,
      page,
    )
  }

  async editAppointment(appointmentId: number, request: AppointmentUpdateRequest, user: ServiceUser) {
    return this.activitiesApiClient.patchUpdateAppointment(appointmentId, request, user)
  }

  getRolledOutPrisons() {
    return this.activitiesApiClient.getRolledOutPrisons()
  }

  async getAllAttendance(sessionDate: Date, user: ServiceUser, eventTier?: EventTier): Promise<AllAttendance[]> {
    return this.activitiesApiClient.getAllAttendance(sessionDate, user, eventTier)
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

  async uncancelAppointment(appointmentId: number, request: AppointmentUncancelRequest, user: ServiceUser) {
    return this.activitiesApiClient.uncancelAppointments(appointmentId, request, user)
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
    scheduleInstanceId?: number,
  ) {
    const request: PrisonerDeallocationRequest = { prisonerNumbers, reasonCode, caseNote, endDate, scheduleInstanceId }
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

  async getInternalLocationEvents(
    prisonCode: string,
    date: Date,
    internalLocationIds: number[],
    user: ServiceUser,
    timeSlot?: string,
  ) {
    return this.activitiesApiClient.getInternalLocationEvents(
      prisonCode,
      format(date, 'yyyy-MM-dd'),
      internalLocationIds,
      user,
      timeSlot,
    )
  }

  async getInternalLocationEventsByDpsLocationIds(
    prisonCode: string,
    date: Date,
    dpsLocationIds: string[],
    user: ServiceUser,
    timeSlot?: string,
  ) {
    return this.activitiesApiClient.getInternalLocationEventsByDpsLocationIds(
      prisonCode,
      format(date, 'yyyy-MM-dd'),
      dpsLocationIds,
      user,
      timeSlot,
    )
  }

  async getAppointmentAttendanceSummaries(
    prisonCode: string,
    date: Date,
    user: ServiceUser,
    categoryCode?: string,
    customAppointmentName?: string,
  ) {
    return this.activitiesApiClient.getAppointmentAttendanceSummaries(
      prisonCode,
      format(date, 'yyyy-MM-dd'),
      user,
      categoryCode ?? null,
      customAppointmentName ?? null,
    )
  }

  async updateMultipleAppointmentAttendances(
    action: AttendanceAction,
    requests: MultipleAppointmentAttendanceRequest[],
    user: ServiceUser,
  ) {
    return this.activitiesApiClient.putAppointmentAttendances(action, requests, user)
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
    return r.filter(item => item.prisonLive).map(item => item.prisonCode)
  }

  async getNonAssociations(
    scheduleId: number,
    prisonerNumber: string,
    user: ServiceUser,
  ): Promise<NonAssociationDetails[]> {
    return this.activitiesApiClient.getNonAssociationsForPrisonerWithinSchedule(scheduleId, prisonerNumber, user)
  }

  async getAppointmentsByStatusAndDate(
    prisonCode: string,
    status: AttendanceStatus,
    date: Date,
    user: ServiceUser,
    categoryCode?: string,
    customName?: string,
    prisonerNumber?: string,
    eventTier?: EventTier,
    organiserCode?: EventOrganiser,
  ): Promise<AppointmentAttendeeByStatus[]> {
    return this.activitiesApiClient.AppointmentAttendeeByStatus(
      prisonCode,
      status,
      format(date, 'yyyy-MM-dd'),
      user,
      categoryCode ?? null,
      customName ?? null,
      prisonerNumber ?? null,
      eventTier ?? null,
      organiserCode ?? null,
    )
  }

  async getAppointmentMigrationSummary(
    prisonCode: string,
    startDate: string,
    categoryCodes: string,
    user: ServiceUser,
  ): Promise<AppointmentCountSummary[]> {
    return this.activitiesApiClient.getAppointmentMigrationSummary(prisonCode, startDate, categoryCodes, user)
  }

  async deleteMigratedAppointments(
    prisonCode: string,
    startDate: string,
    categoryCode: string,
    user: ServiceUser,
  ): Promise<void> {
    return this.activitiesApiClient.deleteMigratedAppointments(prisonCode, startDate, categoryCode, user)
  }

  async postPrisonPayBand(
    prisonCode: string,
    request: PrisonPayBandCreateRequest,
    user: ServiceUser,
  ): Promise<PrisonPayBand> {
    return this.activitiesApiClient.postPrisonPayBand(prisonCode, request, user)
  }

  async patchPrisonPayBand(
    prisonCode: string,
    request: PrisonPayBandUpdateRequest,
    prisonPayBandId: number,
    user: ServiceUser,
  ): Promise<PrisonPayBand> {
    return this.activitiesApiClient.patchPrisonPayBand(prisonCode, prisonPayBandId, request, user)
  }

  async cancelMultipleActivities(
    scheduledInstanceIds: number[],
    cancelRequest: MultipleSessionCancellationRequest,
    user: ServiceUser,
  ) {
    const scheduleInstancesCancelRequest: ScheduleInstancesCancelRequest = {
      ...cancelRequest,
      scheduleInstanceIds: scheduledInstanceIds,
      username: user.username,
    }
    return this.activitiesApiClient.putCancelMultipleActivities(scheduleInstancesCancelRequest, user)
  }
}
