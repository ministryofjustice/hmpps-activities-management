import { asSystem, asUser, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
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
  WaitingListApplicationHistory,
} from '../@types/activitiesAPI/types'
import { ActivityCategoryEnum } from './activityCategoryEnum'
import { toDateString } from '../utils/utils'
import TimeSlot from '../enum/timeSlot'
import { AttendanceStatus } from '../@types/appointments'
import EventTier from '../enum/eventTiers'
import EventOrganiser from '../enum/eventOrganisers'
import AttendanceAction from '../enum/attendanceAction'
import logger from '../../logger'

const CASELOAD_HEADER = (caseloadId: string) => ({ 'Caseload-Id': caseloadId })

export default class ActivitiesApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Activities Management API', config.apis.activitiesApi, logger, authenticationClient)
  }

  async getActivity(activityId: number, includeScheduledInstances: boolean, user: ServiceUser): Promise<Activity> {
    return this.get(
      {
        path: `/activities/${activityId}/filtered`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { includeScheduledInstances },
      },
      asUser(user.token),
    )
  }

  async getActivityCategories(user: ServiceUser): Promise<ActivityCategory[]> {
    return this.get(
      {
        path: `/activity-categories`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getAttendanceReasons(user: ServiceUser): Promise<AttendanceReason[]> {
    return this.get(
      {
        path: `/attendance-reasons`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getActivities(prisonCode: string, excludeArchived: boolean, user: ServiceUser): Promise<ActivitySummary[]> {
    return this.get(
      {
        path: `/prison/${prisonCode}/activities`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { excludeArchived },
      },
      asUser(user.token),
    )
  }

  async getScheduledActivitiesAtPrison(
    prisonCode: string,
    startDate: Date,
    endDate: Date,
    user: ServiceUser,
    slot?: TimeSlot,
    cancelled?: boolean,
  ): Promise<ScheduledActivity[]> {
    return this.get(
      {
        path: `/prisons/${prisonCode}/scheduled-instances`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: {
          startDate: toDateString(startDate),
          endDate: toDateString(endDate),
          slot,
          cancelled,
        },
      },
      asUser(user.token),
    )
  }

  async getSuspendedPrisonersActivityAttendance(
    prisonCode: string,
    date: Date,
    user: ServiceUser,
    categories?: ActivityCategoryEnum[],
    reason?: string,
  ): Promise<SuspendedPrisonerAttendance[]> {
    return this.get(
      {
        path: `/attendances/${prisonCode}/suspended`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: {
          date: toDateString(date),
          ...(reason && { reason }),
          ...(categories && { categories: categories.toString() }),
        },
      },
      asUser(user.token),
    )
  }

  async getScheduledActivity(id: number, user: ServiceUser): Promise<ScheduledActivity> {
    return this.get(
      {
        path: `/scheduled-instances/${id}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getScheduledActivities(ids: number[], user: ServiceUser): Promise<ScheduledActivity[]> {
    return this.post(
      {
        path: `/scheduled-instances`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: ids,
      },
      asUser(user.token),
    )
  }

  async postActivityCreation(createBody: ActivityCreateRequest, user: ServiceUser): Promise<Activity> {
    return this.post(
      {
        path: `/activities`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: createBody,
      },
      asUser(user.token),
    )
  }

  async patchActivityUpdate(
    activityId: number,
    updateBody: ActivityUpdateRequest,
    user: ServiceUser,
  ): Promise<Activity> {
    return this.patch(
      {
        path: `/activities/${user.activeCaseLoadId}/activityId/${activityId}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: updateBody,
      },
      asUser(user.token),
    )
  }

  async patchAllocationUpdate(
    allocationId: number,
    updateBody: AllocationUpdateRequest,
    user: ServiceUser,
  ): Promise<Allocation> {
    return this.patch(
      {
        path: `/allocations/${user.activeCaseLoadId}/allocationId/${allocationId}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: updateBody,
      },
      asUser(user.token),
    )
  }

  async suspendAllocations(request: SuspendPrisonerRequest, user: ServiceUser): Promise<Allocation> {
    return this.post(
      {
        path: `/allocations/${user.activeCaseLoadId}/suspend`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: request,
      },
      asUser(user.token),
    )
  }

  async unsuspendAllocations(request: UnsuspendPrisonerRequest, user: ServiceUser): Promise<Allocation> {
    return this.post(
      {
        path: `/allocations/${user.activeCaseLoadId}/unsuspend`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: request,
      },
      asUser(user.token),
    )
  }

  async postAllocation(
    scheduleId: number,
    prisonerNumber: string,
    payBandId: number,
    user: ServiceUser,
    startDate: string,
    endDate: string,
    exclusions: Slot[],
    scheduleInstanceId?: number,
  ): Promise<void> {
    return this.post(
      {
        path: `/schedules/${scheduleId}/allocations`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: { prisonerNumber, payBandId, startDate, endDate, exclusions, scheduleInstanceId },
      },
      asUser(user.token),
    )
  }

  async getPayBandsForPrison(prisonCode: string, user: ServiceUser): Promise<PrisonPayBand[]> {
    return this.get(
      {
        path: `/prison/${prisonCode}/prison-pay-bands`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getScheduledEventsByPrisonerNumbers(
    prisonCode: string,
    date: string,
    prisonerNumbers: string[],
    user: ServiceUser,
    timeSlot?: string,
  ): Promise<PrisonerScheduledEvents> {
    return this.post(
      {
        path: `/scheduled-events/prison/${prisonCode}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { date, timeSlot },
        data: prisonerNumbers,
      },
      asUser(user.token),
    )
  }

  async getPrisonRolloutPlan(prisonCode: string): Promise<RolloutPrisonPlan> {
    return this.get(
      {
        path: `/rollout/${prisonCode}`,
      },
      asSystem(),
    )
  }

  async getRolledOutPrisons(): Promise<RolloutPrisonPlan[]> {
    return this.get(
      {
        path: `/rollout`,
      },
      asSystem(),
    )
  }

  async getActivitySchedule(id: number, user: ServiceUser): Promise<ActivitySchedule> {
    return this.get(
      {
        path: `/schedules/${id}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getActivityPayHistory(activityId: number, user: ServiceUser): Promise<ActivityPayHistory> {
    return this.get(
      {
        path: `/activities/${activityId}/pay-history`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getPrisonRegime(prisonCode: string, user: ServiceUser): Promise<PrisonRegime[]> {
    return this.get(
      {
        path: `/prison/prison-regime/${prisonCode}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async updatePrisonRegime(regimeSchedule: PrisonRegime[], agencyId: string, user: ServiceUser): Promise<void> {
    return this.post(
      {
        path: `/rollout/prison-regime/${agencyId}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: regimeSchedule,
      },
      asUser(user.token),
    )
  }

  async getAttendees(id: number, user: ServiceUser): Promise<ScheduledAttendee[]> {
    return this.get(
      {
        path: `/scheduled-instances/${id}/scheduled-attendees`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getAttendeesForScheduledInstances(
    scheduledInstanceIds: number[],
    user: ServiceUser,
  ): Promise<ScheduledAttendee[]> {
    return this.post(
      {
        path: `/scheduled-instances/scheduled-attendees`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: scheduledInstanceIds,
      },
      asUser(user.token),
    )
  }

  async updateAttendances(attendanceUpdates: AttendanceUpdateRequest[], user: ServiceUser): Promise<void> {
    return this.put(
      {
        path: '/attendances',
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: attendanceUpdates,
      },
      asUser(user.token),
    )
  }

  async getPrisonLocationGroups(prisonCode: string, user: ServiceUser): Promise<LocationGroup[]> {
    return this.get(
      {
        path: `/locations/prison/${prisonCode}/location-groups`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getPrisonLocationPrefixByGroup(
    prisonCode: string,
    locationGroup: string,
    user: ServiceUser,
  ): Promise<LocationPrefix> {
    return this.get(
      {
        path: `/locations/prison/${prisonCode}/location-prefix`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { groupName: locationGroup },
      },
      asUser(user.token),
    )
  }

  async getAllocations(scheduleId: number, user: ServiceUser): Promise<Allocation[]> {
    return this.getAllocationsWithParams(scheduleId, { activeOnly: true }, user)
  }

  async getAllocationsWithParams(
    scheduleId: number,
    params: GetAllocationsParams,
    user: ServiceUser,
  ): Promise<Allocation[]> {
    return this.get(
      {
        path: `/schedules/${scheduleId}/allocations`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: params,
      },
      asUser(user.token),
    )
  }

  async getAllocation(allocationId: number, user: ServiceUser): Promise<Allocation> {
    return this.get(
      {
        path: `/allocations/id/${allocationId}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getPrisonerAllocations(
    prisonCode: string,
    prisonerNumbers: string[],
    user: ServiceUser,
  ): Promise<PrisonerAllocations[]> {
    if (prisonerNumbers.length === 0) return []
    return this.post(
      {
        path: `/prisons/${prisonCode}/prisoner-allocations`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: prisonerNumbers,
      },
      asUser(user.token),
    )
  }

  async getAppointmentSeriesDetails(appointmentSeriesId: number, user: ServiceUser): Promise<AppointmentSeriesDetails> {
    return this.get(
      {
        path: `/appointment-series/${appointmentSeriesId}/details`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getAppointmentDetails(appointmentId: number, user: ServiceUser): Promise<AppointmentDetails> {
    return this.get(
      {
        path: `/appointments/${appointmentId}/details`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getAppointments(appointmentIds: number[], user: ServiceUser): Promise<AppointmentDetails[]> {
    return this.post(
      {
        path: '/appointments/details',
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: appointmentIds,
      },
      asUser(user.token),
    )
  }

  async getAppointmentCategories(user: ServiceUser): Promise<AppointmentCategorySummary[]> {
    return this.get(
      {
        path: `/appointment-categories`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getAppointmentLocations(prisonCode: string, user: ServiceUser): Promise<AppointmentLocationSummary[]> {
    return this.get(
      {
        path: `/appointment-locations/${prisonCode}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async postCreateAppointmentSeries(
    request: AppointmentSeriesCreateRequest,
    user: ServiceUser,
  ): Promise<AppointmentSeries> {
    return this.post(
      {
        path: `/appointment-series`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: request,
      },
      asUser(user.token),
    )
  }

  async postCreateAppointmentSet(request: AppointmentSetCreateRequest, user: ServiceUser): Promise<AppointmentSet> {
    return this.post(
      {
        path: `/appointment-set`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: request,
      },
      asUser(user.token),
    )
  }

  async getAppointmentSetDetails(appointmentSetId: number, user: ServiceUser): Promise<AppointmentSetDetails> {
    return this.get(
      {
        path: `/appointment-set/${appointmentSetId}/details`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async putUncancelScheduledActivity(
    scheduleInstanceId: number,
    uncancelRequest: UncancelScheduledInstanceRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.put(
      {
        path: `/scheduled-instances/${scheduleInstanceId}/uncancel`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: uncancelRequest,
      },
      asUser(user.token),
    )
  }

  async getAttendanceDetails(attendanceId: number): Promise<Attendance> {
    return this.get(
      {
        path: `/attendances/${attendanceId}`,
      },
      asSystem(),
    )
  }

  async patchUpdateAppointment(
    appointmentId: number,
    request: AppointmentUpdateRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.patch(
      {
        path: `/appointments/${appointmentId}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: request,
      },
      asUser(user.token),
    )
  }

  async getActivityCandidates(
    scheduleId: number,
    user: ServiceUser,
    suitableIncentiveLevel?: string[],
    suitableRiskLevel?: string[],
    suitableForEmployed?: boolean,
    noAllocations?: boolean,
    search?: string,
    page?: number,
  ): Promise<PageActivityCandidate> {
    return this.get(
      {
        path: `/schedules/${scheduleId}/candidates`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: {
          suitableIncentiveLevel,
          suitableRiskLevel,
          suitableForEmployed,
          noAllocations,
          search,
          page,
          size: 5,
        },
      },
      asUser(user.token),
    )
  }

  async getAllAttendance(sessionDate: Date, user: ServiceUser, eventTier?: EventTier): Promise<AllAttendance[]> {
    return this.get(
      {
        path: `/attendances/${user.activeCaseLoadId}/${toDateString(sessionDate)}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { eventTier },
      },
      asUser(user.token),
    )
  }

  async searchAppointments(
    prisonCode: string,
    request: AppointmentSearchRequest,
    user: ServiceUser,
  ): Promise<AppointmentSearchResult[]> {
    return this.post(
      {
        path: `/appointments/${prisonCode}/search`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: request,
      },
      asUser(user.token),
    )
  }

  async cancelAppointments(appointmentId: number, request: AppointmentCancelRequest, user: ServiceUser): Promise<void> {
    return this.put(
      {
        path: `/appointments/${appointmentId}/cancel`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: request,
      },
      asUser(user.token),
    )
  }

  async uncancelAppointments(
    appointmentId: number,
    request: AppointmentUncancelRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.put(
      {
        path: `/appointments/${appointmentId}/uncancel`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: request,
      },
      asUser(user.token),
    )
  }

  async getChangeEvents(
    prison: string,
    date: string,
    page: number,
    pageSize: number,
    user: ServiceUser,
  ): Promise<EventReviewSearchResults> {
    return this.get(
      {
        path: `/event-review/prison/${prison}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { date, page, size: pageSize },
      },
      asUser(user.token),
    )
  }

  async acknowledgeChangeEvents(prison: string, request: EventAcknowledgeRequest, user: ServiceUser): Promise<void> {
    return this.post(
      {
        path: `/event-review/prison/${prison}/acknowledge`,
        data: request,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async getDeallocationReasons(user: ServiceUser): Promise<DeallocationReason[]> {
    return this.get(
      {
        path: `/allocations/deallocation-reasons`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async deallocateFromActivity(
    scheduleId: number,
    request: PrisonerDeallocationRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.put(
      {
        path: `/schedules/${scheduleId}/deallocate`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: request,
      },
      asUser(user.token),
    )
  }

  async allocationSuitability(
    scheduleId: number,
    prisonerNumber: string,
    user: ServiceUser,
  ): Promise<AllocationSuitability> {
    return this.get(
      {
        path: `/schedules/${scheduleId}/suitability`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { prisonerNumber },
      },
      asUser(user.token),
    )
  }

  async postWaitlistApplication(
    waitlistApplicationRequest: WaitingListApplicationRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.post(
      {
        path: `/allocations/${user.activeCaseLoadId}/waiting-list-application`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: waitlistApplicationRequest,
      },
      asUser(user.token),
    )
  }

  async fetchActivityWaitlist(
    scheduleId: number,
    includeNonAssociationsCheck: boolean,
    user: ServiceUser,
  ): Promise<WaitingListApplication[]> {
    return this.get(
      {
        path: `/schedules/${scheduleId}/waiting-list-applications`,
        query: { includeNonAssociationsCheck },
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async fetchWaitlistApplication(applicationId: number, user: ServiceUser): Promise<WaitingListApplication> {
    return this.get(
      {
        path: `/waiting-list-applications/${applicationId}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async fetchWaitlistApplicationHistory(
    applicationId: number,
    user: ServiceUser,
  ): Promise<WaitingListApplicationHistory[]> {
    return this.get(
      {
        path: `/waiting-list-applications/${applicationId}/history`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async patchWaitlistApplication(
    applicationId: number,
    updateWaitlistRequest: WaitingListApplicationUpdateRequest,
    user: ServiceUser,
  ): Promise<WaitingListApplication> {
    return this.patch(
      {
        path: `/waiting-list-applications/${applicationId}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: updateWaitlistRequest,
      },
      asUser(user.token),
    )
  }

  async getScheduledInstanceAttendanceSummary(
    prisonCode: string,
    sessionDate: Date,
    user: ServiceUser,
  ): Promise<ScheduledInstanceAttendanceSummary[]> {
    return this.get(
      {
        path: `/scheduled-instances/attendance-summary`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: {
          prisonCode,
          date: toDateString(sessionDate),
        },
      },
      asUser(user.token),
    )
  }

  async getInternalLocationEventsSummaries(
    prisonCode: string,
    date: string,
    user: ServiceUser,
    timeSlot?: string,
  ): Promise<InternalLocationEventsSummary[]> {
    return this.get(
      {
        path: `/locations/prison/${prisonCode}/events-summaries`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { date, timeSlot },
      },
      asUser(user.token),
    )
  }

  // TODO: 2388: Replace location IDs with DPS Locations UUIDs
  async getInternalLocationEvents(
    prisonCode: string,
    date: string,
    internalLocationIds: number[],
    user: ServiceUser,
    timeSlot?: string,
  ): Promise<InternalLocationEvents[]> {
    return this.post(
      {
        path: `/scheduled-events/prison/${prisonCode}/locations`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { date, timeSlot },
        data: internalLocationIds,
      },
      asUser(user.token),
    )
  }

  async getInternalLocationEventsByDpsLocationIds(
    prisonCode: string,
    date: string,
    dpsLocationIds: string[],
    user: ServiceUser,
    timeSlot?: string,
  ): Promise<InternalLocationEvents[]> {
    return this.post(
      {
        path: `/scheduled-events/prison/${prisonCode}/location-events`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { date, timeSlot },
        data: dpsLocationIds,
      },
      asUser(user.token),
    )
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
    return this.get(
      {
        path: `/appointments/${prisonCode}/attendance-summaries`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query,
      },
      asUser(user.token),
    )
  }

  async putAppointmentAttendances(
    action: AttendanceAction,
    requests: MultipleAppointmentAttendanceRequest[],
    user: ServiceUser,
  ): Promise<Appointment> {
    return this.put(
      {
        path: `/appointments/updateAttendances`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { action },
        data: requests,
      },
      asUser(user.token),
    )
  }

  async searchWaitingListApplications(
    prisonCode: string,
    searchRequest: WaitingListSearchRequest,
    pageOptions: WaitingListSearchParams,
    user: ServiceUser,
  ): Promise<WaitingListApplicationPaged> {
    return this.post(
      {
        path: `/waiting-list-applications/${prisonCode}/search`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: searchRequest,
        query: pageOptions,
      },
      asUser(user.token),
    )
  }

  async getNonAssociationsForPrisonerWithinSchedule(
    scheduleId: number,
    prisonerNumber: string,
    user: ServiceUser,
  ): Promise<NonAssociationDetails[]> {
    return this.get(
      {
        path: `/schedules/${scheduleId}/non-associations`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { prisonerNumber },
      },
      asUser(user.token),
    )
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
    return this.get(
      {
        path: `/appointments/${prisonCode}/${status}/attendance`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query,
      },
      asUser(user.token),
    )
  }

  async getAppointmentMigrationSummary(
    prisonCode: string,
    startDate: string,
    categoryCodes: string,
    user: ServiceUser,
  ): Promise<AppointmentCountSummary[]> {
    return this.get(
      {
        path: `/migrate-appointment/${prisonCode}/summary`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { startDate, categoryCodes },
      },
      asUser(user.token),
    )
  }

  async deleteMigratedAppointments(
    prisonCode: string,
    startDate: string,
    categoryCode: string,
    user: ServiceUser,
  ): Promise<void> {
    return this.delete(
      {
        path: `/migrate-appointment/${prisonCode}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        query: { startDate, categoryCode },
      },
      asUser(user.token),
    )
  }

  async postPrisonPayBand(
    prisonCode: string,
    request: PrisonPayBandCreateRequest,
    user: ServiceUser,
  ): Promise<PrisonPayBand> {
    return this.post(
      {
        path: `/prison/${prisonCode}/prison-pay-band`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: request,
      },
      asUser(user.token),
    )
  }

  async patchPrisonPayBand(
    prisonCode: string,
    prisonPayBandId: number,
    request: PrisonPayBandUpdateRequest,
    user: ServiceUser,
  ): Promise<PrisonPayBand> {
    return this.patch(
      {
        path: `/prison/${prisonCode}/prison-pay-band/${prisonPayBandId}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: request,
      },
      asUser(user.token),
    )
  }

  async putCancelMultipleActivities(cancelRequest: ScheduleInstancesCancelRequest, user: ServiceUser): Promise<void> {
    return this.put(
      {
        path: `/scheduled-instances/cancel`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: cancelRequest,
      },
      asUser(user.token),
    )
  }

  async putUncancelMultipleActivities(
    uncancelRequest: ScheduleInstancesUncancelRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.put(
      {
        path: `/scheduled-instances/uncancel`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: uncancelRequest,
      },
      asUser(user.token),
    )
  }

  async putUpdateCancelledSessionDetails(
    instanceId: number,
    cancelRequest: ScheduledInstancedUpdateRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.put(
      {
        path: `/scheduled-instances/${instanceId}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: cancelRequest,
      },
      asUser(user.token),
    )
  }

  async postAdvanceAttendances(
    createRequest: AdvanceAttendanceCreateRequest,
    user: ServiceUser,
  ): Promise<AdvanceAttendance> {
    return this.post(
      {
        path: '/advance-attendances',
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: createRequest,
      },
      asUser(user.token),
    )
  }

  async getAdvanceAttendanceDetails(attendanceId: number, user: ServiceUser): Promise<AdvanceAttendance> {
    return this.get(
      {
        path: `/advance-attendances/${attendanceId}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async deleteAdvanceAttendance(attendanceId: number, user: ServiceUser): Promise<AdvanceAttendance> {
    return this.delete(
      {
        path: `/advance-attendances/${attendanceId}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
      },
      asUser(user.token),
    )
  }

  async putAdvanceAttendance(
    attendanceId: number,
    issuePayment: boolean,
    user: ServiceUser,
  ): Promise<AdvanceAttendance> {
    return this.put(
      {
        path: `/advance-attendances/${attendanceId}`,
        headers: CASELOAD_HEADER(user.activeCaseLoadId),
        data: {
          issuePayment,
        },
      },
      asUser(user.token),
    )
  }
}
