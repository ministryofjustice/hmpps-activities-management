import AbstractHmppsRestClient from './abstractHmppsRestClient'
import config, { ApiConfig } from '../config'
import { ServiceUser } from '../@types/express'
import {
  Activity,
  ActivityCategory,
  ActivityCreateRequest,
  ActivitySchedule,
  ActivitySummary,
  ActivityUpdateRequest,
  AllAttendance,
  Allocation,
  AllocationSuitability,
  AllocationUpdateRequest,
  Appointment,
  AppointmentAttendanceSummary,
  AppointmentAttendeeByStatus,
  AppointmentCancelRequest,
  AppointmentCategorySummary,
  AppointmentCountSummary,
  AppointmentDetails,
  AppointmentLocationSummary,
  AppointmentSearchRequest,
  AppointmentSearchResult,
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
  DeallocationReason,
  EventAcknowledgeRequest,
  EventReviewSearchResults,
  GetAllocationsParams,
  InternalLocationEvents,
  InternalLocationEventsSummary,
  LocationGroup,
  LocationPrefix,
  MultipleAppointmentAttendanceRequest,
  NonAssociationDetails,
  PageActivityCandidate,
  PrisonerAllocations,
  PrisonerDeallocationRequest,
  PrisonerScheduledEvents,
  PrisonPayBand,
  PrisonPayBandCreateRequest,
  PrisonPayBandUpdateRequest,
  PrisonRegime,
  RolloutPrisonPlan,
  ScheduledActivity,
  ScheduledAttendee,
  ScheduledInstanceAttendanceSummary,
  ScheduleInstanceCancelRequest,
  ScheduleInstancesCancelRequest,
  ScheduleInstancesUncancelRequest,
  ScheduledInstancedUpdateRequest,
  Slot,
  SuspendedPrisonerAttendance,
  SuspendPrisonerRequest,
  UncancelScheduledInstanceRequest,
  UnsuspendPrisonerRequest,
  WaitingListApplication,
  WaitingListApplicationPaged,
  WaitingListApplicationRequest,
  WaitingListApplicationUpdateRequest,
  WaitingListSearchParams,
  WaitingListSearchRequest,
  AdvanceAttendanceCreateRequest,
  AdvanceAttendance,
  ActivityPayHistory,
} from '../@types/activitiesAPI/types'
import { ActivityCategoryEnum } from './activityCategoryEnum'
import { toDateString } from '../utils/utils'
import TimeSlot from '../enum/timeSlot'
import { AttendanceStatus } from '../@types/appointments'
import EventTier from '../enum/eventTiers'
import EventOrganiser from '../enum/eventOrganisers'
import AttendanceAction from '../enum/attendanceAction'

const CASELOAD_HEADER = (caseloadId: string) => ({ 'Caseload-Id': caseloadId })

export default class ActivitiesApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Activities Management API', config.apis.activitiesApi as ApiConfig)
  }

  getActivity(activityId: number, user: ServiceUser): Promise<Activity> {
    return this.get({
      path: `/activities/${activityId}/filtered`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getActivityCategories(user: ServiceUser): Promise<ActivityCategory[]> {
    return this.get({
      path: `/activity-categories`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getAttendanceReasons(user: ServiceUser): Promise<AttendanceReason[]> {
    return this.get({
      path: `/attendance-reasons`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getActivities(prisonCode: string, excludeArchived: boolean, user: ServiceUser): Promise<ActivitySummary[]> {
    return this.get({
      path: `/prison/${prisonCode}/activities`,
      query: { excludeArchived },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  getScheduledActivitiesAtPrison(
    prisonCode: string,
    startDate: Date,
    endDate: Date,
    user: ServiceUser,
    slot?: TimeSlot,
    cancelled?: boolean,
  ): Promise<ScheduledActivity[]> {
    return this.get({
      path: `/prisons/${prisonCode}/scheduled-instances`,
      query: {
        startDate: toDateString(startDate),
        endDate: toDateString(endDate),
        slot,
        cancelled,
      },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  getSuspendedPrisonersActivityAttendance(
    prisonCode: string,
    date: Date,
    user: ServiceUser,
    categories?: ActivityCategoryEnum[],
    reason?: string,
  ): Promise<SuspendedPrisonerAttendance[]> {
    return this.get({
      path: `/attendances/${prisonCode}/suspended`,
      query: {
        date: toDateString(date),
        ...(reason && { reason }),
        ...(categories && { categories: categories.toString() }),
      },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  getScheduledActivity(id: number, user: ServiceUser): Promise<ScheduledActivity> {
    return this.get({
      path: `/scheduled-instances/${id}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  getScheduledActivities(ids: number[], user: ServiceUser): Promise<ScheduledActivity[]> {
    return this.post({
      path: `/scheduled-instances`,
      data: ids,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  postActivityCreation(createBody: ActivityCreateRequest, user: ServiceUser): Promise<Activity> {
    return this.post({
      path: `/activities`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: createBody,
    })
  }

  patchActivityUpdate(activityId: number, updateBody: ActivityUpdateRequest, user: ServiceUser): Promise<Activity> {
    return this.patch({
      path: `/activities/${user.activeCaseLoadId}/activityId/${activityId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: updateBody,
    })
  }

  patchAllocationUpdate(
    allocationId: number,
    updateBody: AllocationUpdateRequest,
    user: ServiceUser,
  ): Promise<Allocation> {
    return this.patch({
      path: `/allocations/${user.activeCaseLoadId}/allocationId/${allocationId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: updateBody,
    })
  }

  suspendAllocations(request: SuspendPrisonerRequest, user: ServiceUser) {
    return this.post({
      path: `/allocations/${user.activeCaseLoadId}/suspend`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: request,
    })
  }

  unsuspendAllocations(request: UnsuspendPrisonerRequest, user: ServiceUser) {
    return this.post({
      path: `/allocations/${user.activeCaseLoadId}/unsuspend`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: request,
    })
  }

  postAllocation(
    scheduleId: number,
    prisonerNumber: string,
    payBandId: number,
    user: ServiceUser,
    startDate: string,
    endDate: string,
    exclusions: Slot[],
    scheduleInstanceId?: number,
  ): Promise<void> {
    return this.post({
      path: `/schedules/${scheduleId}/allocations`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: { prisonerNumber, payBandId, startDate, endDate, exclusions, scheduleInstanceId },
    })
  }

  getPayBandsForPrison(prisonCode: string, user: ServiceUser): Promise<PrisonPayBand[]> {
    return this.get({
      path: `/prison/${prisonCode}/prison-pay-bands`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  getScheduledEvents(
    prisonCode: string,
    prisonerNumber: string,
    startDate: string,
    endDate: string,
    user: ServiceUser,
  ): Promise<PrisonerScheduledEvents> {
    return this.get({
      path: `/scheduled-events/prison/${prisonCode}`,
      query: { prisonerNumber, startDate, endDate },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  getScheduledEventsByPrisonerNumbers(
    prisonCode: string,
    date: string,
    prisonerNumbers: string[],
    user: ServiceUser,
    timeSlot?: string,
  ): Promise<PrisonerScheduledEvents> {
    return this.post({
      path: `/scheduled-events/prison/${prisonCode}`,
      query: { date, timeSlot },
      data: prisonerNumbers,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getPrisonRolloutPlan(prisonCode: string): Promise<RolloutPrisonPlan> {
    return this.get({
      path: `/rollout/${prisonCode}`,
    })
  }

  async getRolledOutPrisons(): Promise<RolloutPrisonPlan[]> {
    return this.get({
      path: `/rollout`,
    }).then(res => res as RolloutPrisonPlan[])
  }

  async getActivitySchedule(id: number, user: ServiceUser): Promise<ActivitySchedule> {
    return this.get({
      path: `/schedules/${id}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  getActivityPayHistory(activityId: number, user: ServiceUser): Promise<ActivityPayHistory> {
    return this.get({
      path: `/activities/${activityId}/pay-history`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getPrisonRegime(prisonCode: string, user: ServiceUser): Promise<PrisonRegime[]> {
    return this.get({
      path: `/prison/prison-regime/${prisonCode}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async updatePrisonRegime(regimeSchedule: PrisonRegime[], agencyId: string, user: ServiceUser): Promise<void> {
    return this.post({
      path: `/rollout/prison-regime/${agencyId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: regimeSchedule,
    })
  }

  async getAttendees(id: number, user: ServiceUser): Promise<ScheduledAttendee[]> {
    return this.get({
      path: `/scheduled-instances/${id}/scheduled-attendees`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async updateAttendances(attendanceUpdates: AttendanceUpdateRequest[], user: ServiceUser): Promise<void> {
    return this.put({
      path: '/attendances',
      data: attendanceUpdates,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getPrisonLocationGroups(prisonCode: string, user: ServiceUser): Promise<LocationGroup[]> {
    return this.get({
      path: `/locations/prison/${prisonCode}/location-groups`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getPrisonLocationPrefixByGroup(
    prisonCode: string,
    locationGroup: string,
    user: ServiceUser,
  ): Promise<LocationPrefix> {
    return this.get({
      path: `/locations/prison/${prisonCode}/location-prefix`,
      query: { groupName: locationGroup },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getAllocations(scheduleId: number, user: ServiceUser): Promise<Allocation[]> {
    return this.getAllocationsWithParams(scheduleId, { activeOnly: true }, user)
  }

  async getAllocationsWithParams(
    scheduleId: number,
    params: GetAllocationsParams,
    user: ServiceUser,
  ): Promise<Allocation[]> {
    return this.get({
      path: `/schedules/${scheduleId}/allocations`,
      query: params,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getAllocation(allocationId: number, user: ServiceUser): Promise<Allocation> {
    return this.get({
      path: `/allocations/id/${allocationId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getPrisonerAllocations(
    prisonCode: string,
    prisonerNumbers: string[],
    user: ServiceUser,
  ): Promise<PrisonerAllocations[]> {
    if (prisonerNumbers.length === 0) return []
    return this.post({
      path: `/prisons/${prisonCode}/prisoner-allocations`,
      data: prisonerNumbers,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getAppointmentSeriesDetails(appointmentSeriesId: number, user: ServiceUser): Promise<AppointmentSeriesDetails> {
    return this.get({
      path: `/appointment-series/${appointmentSeriesId}/details`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getAppointmentDetails(appointmentId: number, user: ServiceUser): Promise<AppointmentDetails> {
    return this.get({
      path: `/appointments/${appointmentId}/details`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getAppointments(appointmentIds: number[], user: ServiceUser): Promise<AppointmentDetails[]> {
    return this.post({
      path: '/appointments/details',
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: appointmentIds,
    })
  }

  async getAppointmentCategories(user: ServiceUser): Promise<AppointmentCategorySummary[]> {
    return this.get({
      path: `/appointment-categories`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getAppointmentLocations(prisonCode: string, user: ServiceUser): Promise<AppointmentLocationSummary[]> {
    return this.get({
      path: `/appointment-locations/${prisonCode}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async postCreateAppointmentSeries(
    request: AppointmentSeriesCreateRequest,
    user: ServiceUser,
  ): Promise<AppointmentSeries> {
    return this.post({
      path: `/appointment-series`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: request,
    })
  }

  async postCreateAppointmentSet(request: AppointmentSetCreateRequest, user: ServiceUser): Promise<AppointmentSet> {
    return this.post({
      path: `/appointment-set`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: request,
    })
  }

  async getAppointmentSetDetails(appointmentSetId: number, user: ServiceUser): Promise<AppointmentSetDetails> {
    return this.get({
      path: `/appointment-set/${appointmentSetId}/details`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async putCancelScheduledActivity(
    scheduleInstanceId: number,
    cancelRequest: ScheduleInstanceCancelRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.put({
      path: `/scheduled-instances/${scheduleInstanceId}/cancel`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: cancelRequest,
    })
  }

  async putUncancelScheduledActivity(
    scheduleInstanceId: number,
    uncancelRequest: UncancelScheduledInstanceRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.put({
      path: `/scheduled-instances/${scheduleInstanceId}/uncancel`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: uncancelRequest,
    })
  }

  async getAttendanceDetails(attendanceId: number): Promise<Attendance> {
    return this.get({
      path: `/attendances/${attendanceId}`,
    })
  }

  async patchUpdateAppointment(
    appointmentId: number,
    request: AppointmentUpdateRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.patch({
      path: `/appointments/${appointmentId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: request,
    })
  }

  getActivityCandidates(
    scheduleId: number,
    user: ServiceUser,
    suitableIncentiveLevel?: string[],
    suitableRiskLevel?: string[],
    suitableForEmployed?: boolean,
    noAllocations?: boolean,
    search?: string,
    page?: number,
  ): Promise<PageActivityCandidate> {
    return this.get({
      path: `/schedules/${scheduleId}/candidates`,
      query: {
        suitableIncentiveLevel,
        suitableRiskLevel,
        suitableForEmployed,
        noAllocations,
        search,
        page,
        size: 5,
      },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  getAllAttendance(sessionDate: Date, user: ServiceUser, eventTier?: EventTier): Promise<AllAttendance[]> {
    return this.get({
      path: `/attendances/${user.activeCaseLoadId}/${toDateString(sessionDate)}`,
      query: { eventTier },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async searchAppointments(
    prisonCode: string,
    request: AppointmentSearchRequest,
    user: ServiceUser,
  ): Promise<AppointmentSearchResult[]> {
    return this.post({
      path: `/appointments/${prisonCode}/search`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: request,
    })
  }

  async cancelAppointments(appointmentId: number, request: AppointmentCancelRequest, user: ServiceUser): Promise<void> {
    return this.put({
      path: `/appointments/${appointmentId}/cancel`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: request,
    })
  }

  async uncancelAppointments(
    appointmentId: number,
    request: AppointmentUncancelRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.put({
      path: `/appointments/${appointmentId}/uncancel`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: request,
    })
  }

  async getChangeEvents(
    prison: string,
    date: string,
    page: number,
    pageSize: number,
    user: ServiceUser,
  ): Promise<EventReviewSearchResults> {
    return this.get({
      path: `/event-review/prison/${prison}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      query: { date, page, size: pageSize },
    })
  }

  async acknowledgeChangeEvents(prison: string, request: EventAcknowledgeRequest, user: ServiceUser): Promise<void> {
    return this.post({
      path: `/event-review/prison/${prison}/acknowledge`,
      data: request,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getDeallocationReasons(user: ServiceUser): Promise<DeallocationReason[]> {
    return this.get({
      path: `/allocations/deallocation-reasons`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async deallocateFromActivity(
    scheduleId: number,
    request: PrisonerDeallocationRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.put({
      path: `/schedules/${scheduleId}/deallocate`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: request,
    })
  }

  async allocationSuitability(
    scheduleId: number,
    prisonerNumber: string,
    user: ServiceUser,
  ): Promise<AllocationSuitability> {
    return this.get({
      path: `/schedules/${scheduleId}/suitability`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      query: { prisonerNumber },
    })
  }

  async postWaitlistApplication(
    waitlistApplicationRequest: WaitingListApplicationRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.post({
      path: `/allocations/${user.activeCaseLoadId}/waiting-list-application`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: waitlistApplicationRequest,
    })
  }

  async fetchActivityWaitlist(
    scheduleId: number,
    includeNonAssociationsCheck: boolean,
    user: ServiceUser,
  ): Promise<WaitingListApplication[]> {
    return this.get({
      path: `/schedules/${scheduleId}/waiting-list-applications`,
      query: { includeNonAssociationsCheck },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async fetchWaitlistApplication(applicationId: number, user: ServiceUser): Promise<WaitingListApplication> {
    return this.get({
      path: `/waiting-list-applications/${applicationId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async patchWaitlistApplication(
    applicationId: number,
    updateWaitlistRequest: WaitingListApplicationUpdateRequest,
    user: ServiceUser,
  ): Promise<WaitingListApplication> {
    return this.patch({
      path: `/waiting-list-applications/${applicationId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: updateWaitlistRequest,
    })
  }

  async getScheduledInstanceAttendanceSummary(
    prisonCode: string,
    sessionDate: Date,
    user: ServiceUser,
  ): Promise<ScheduledInstanceAttendanceSummary[]> {
    return this.get({
      path: `/scheduled-instances/attendance-summary`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      query: {
        prisonCode,
        date: toDateString(sessionDate),
      },
    })
  }

  async getInternalLocationEventsSummaries(
    prisonCode: string,
    date: string,
    user: ServiceUser,
    timeSlot?: string,
  ): Promise<InternalLocationEventsSummary[]> {
    return this.get({
      path: `/locations/prison/${prisonCode}/events-summaries`,
      query: { date, timeSlot },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  // TODO: 2388: Replace location IDs with DPS Locations UUIDs
  async getInternalLocationEvents(
    prisonCode: string,
    date: string,
    internalLocationIds: number[],
    user: ServiceUser,
    timeSlot?: string,
  ): Promise<InternalLocationEvents[]> {
    return this.post({
      path: `/scheduled-events/prison/${prisonCode}/locations`,
      query: { date, timeSlot },
      data: internalLocationIds,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getInternalLocationEventsByDpsLocationIds(
    prisonCode: string,
    date: string,
    dpsLocationIds: string[],
    user: ServiceUser,
    timeSlot?: string,
  ): Promise<InternalLocationEvents[]> {
    return this.post({
      path: `/scheduled-events/prison/${prisonCode}/location-events`,
      query: { date, timeSlot },
      data: dpsLocationIds,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getAppointmentAttendanceSummaries(
    prisonCode: string,
    date: string,
    user: ServiceUser,
    categoryCode?: string,
    customName?: string,
  ): Promise<AppointmentAttendanceSummary[]> {
    const query = {
      date,
      ...(categoryCode && { categoryCode }),
      ...(customName && { customName }),
    }
    return this.get({
      path: `/appointments/${prisonCode}/attendance-summaries`,
      query,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async putAppointmentAttendances(
    action: AttendanceAction,
    requests: MultipleAppointmentAttendanceRequest[],
    user: ServiceUser,
  ): Promise<Appointment> {
    return this.put({
      path: `/appointments/updateAttendances`,
      query: { action },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: requests,
    })
  }

  async searchWaitingListApplications(
    prisonCode: string,
    searchRequest: WaitingListSearchRequest,
    pageOptions: WaitingListSearchParams,
    user: ServiceUser,
  ): Promise<WaitingListApplicationPaged> {
    return this.post({
      path: `/waiting-list-applications/${prisonCode}/search`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: searchRequest,
      query: pageOptions,
    })
  }

  async getNonAssociationsForPrisonerWithinSchedule(
    scheduleId: number,
    prisonerNumber: string,
    user: ServiceUser,
  ): Promise<NonAssociationDetails[]> {
    return this.get({
      path: `/schedules/${scheduleId}/non-associations`,
      query: { prisonerNumber },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async AppointmentAttendeeByStatus(
    prisonCode: string,
    status: AttendanceStatus,
    date: string,
    user: ServiceUser,
    categoryCode: string,
    customName: string,
    prisonerNumber: string,
    eventTier: EventTier,
    organiserCode: EventOrganiser,
  ): Promise<AppointmentAttendeeByStatus[]> {
    const query = {
      date,
      ...(categoryCode && { categoryCode }),
      ...(customName && { customName }),
      ...(prisonerNumber && { prisonerNumber }),
      ...(eventTier && { eventTier }),
      ...(organiserCode && { organiserCode }),
    }
    return this.get({
      path: `/appointments/${prisonCode}/${status}/attendance`,
      query,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getAppointmentMigrationSummary(
    prisonCode: string,
    startDate: string,
    categoryCodes: string,
    user: ServiceUser,
  ): Promise<AppointmentCountSummary[]> {
    return this.get({
      path: `/migrate-appointment/${prisonCode}/summary`,
      query: { startDate, categoryCodes },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async deleteMigratedAppointments(
    prisonCode: string,
    startDate: string,
    categoryCode: string,
    user: ServiceUser,
  ): Promise<void> {
    return this.delete({
      path: `/migrate-appointment/${prisonCode}`,
      query: { startDate, categoryCode },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async postPrisonPayBand(
    prisonCode: string,
    request: PrisonPayBandCreateRequest,
    user: ServiceUser,
  ): Promise<PrisonPayBand> {
    return this.post({
      path: `/prison/${prisonCode}/prison-pay-band`,
      data: request,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async patchPrisonPayBand(
    prisonCode: string,
    prisonPayBandId: number,
    request: PrisonPayBandUpdateRequest,
    user: ServiceUser,
  ): Promise<PrisonPayBand> {
    return this.patch({
      path: `/prison/${prisonCode}/prison-pay-band/${prisonPayBandId}`,
      data: request,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async putCancelMultipleActivities(cancelRequest: ScheduleInstancesCancelRequest, user: ServiceUser): Promise<void> {
    return this.put({
      path: `/scheduled-instances/cancel`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: cancelRequest,
    })
  }

  async putUncancelMultipleActivities(
    uncancelRequest: ScheduleInstancesUncancelRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.put({
      path: `/scheduled-instances/uncancel`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: uncancelRequest,
    })
  }

  async putUpdateCancelledSessionDetails(
    instanceId: number,
    cancelRequest: ScheduledInstancedUpdateRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.put({
      path: `/scheduled-instances/${instanceId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: cancelRequest,
    })
  }

  async postAdvanceAttendances(
    createRequest: AdvanceAttendanceCreateRequest,
    user: ServiceUser,
  ): Promise<AdvanceAttendance> {
    return this.post({
      path: '/advance-attendances',
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: createRequest,
    })
  }

  async getAdvanceAttendanceDetails(attendanceId: number, user: ServiceUser): Promise<AdvanceAttendance> {
    return this.get({
      path: `/advance-attendances/${attendanceId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async deleteAdvanceAttendance(attendanceId: number, user: ServiceUser): Promise<AdvanceAttendance> {
    return this.delete({
      path: `/advance-attendances/${attendanceId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async putAdvanceAttendance(
    attendanceId: number,
    issuePayment: boolean,
    user: ServiceUser,
  ): Promise<AdvanceAttendance> {
    return this.put({
      path: `/advance-attendances/${attendanceId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: {
        issuePayment,
      },
    })
  }
}
