import AbstractHmppsRestClient from './abstractHmppsRestClient'
import config, { ApiConfig } from '../config'
import { ServiceUser } from '../@types/express'
import {
  ActivityCategory,
  ActivityLite,
  ActivitySchedule,
  ActivityScheduleLite,
  Attendance,
  AttendanceUpdateRequest,
  InternalLocation,
  PrisonerScheduledEvents,
  ScheduledActivity,
  LocationGroup,
  LocationPrefix,
  Allocation,
  PrisonerAllocations,
  Activity,
  ActivityCreateRequest,
  PrisonPayBand,
  Appointment,
  AppointmentCategorySummary,
  AppointmentCreateRequest,
  AttendanceReason,
  AppointmentDetails,
  AppointmentOccurrenceDetails,
  ScheduleInstanceCancelRequest,
  UncancelScheduledInstanceRequest,
  PageActivityCandidate,
  AppointmentOccurrenceUpdateRequest,
  AppointmentLocationSummary,
  AllAttendance,
  RolloutPrisonPlan,
  AppointmentOccurrenceSearchRequest,
  AppointmentOccurrenceSearchResult,
  ActivityUpdateRequest,
  AllocationUpdateRequest,
  AppointmentOccurrenceCancelRequest,
  BulkAppointmentsRequest,
  BulkAppointment,
  BulkAppointmentDetails,
  EventReviewSearchResults,
  DeallocationReason,
  PrisonerDeallocationRequest,
  EventAcknowledgeRequest,
  AllocationSuitability,
  WaitingListApplicationRequest,
} from '../@types/activitiesAPI/types'
import { toDateString } from '../utils/utils'
import TimeSlot from '../enum/timeSlot'

const CASELOAD_HEADER = (caseloadId: string) => ({ 'Caseload-Id': caseloadId })

export default class ActivitiesApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Activities Management API', config.apis.activitiesApi as ApiConfig)
  }

  getActivity(activityId: number, user: ServiceUser): Promise<Activity> {
    return this.get({
      path: `/activities/${activityId}`,
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

  async getActivitiesInCategory(prisonCode: string, categoryId: number, user: ServiceUser): Promise<ActivityLite[]> {
    return this.get({
      path: `/prison/${prisonCode}/activity-categories/${categoryId}/activities`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getActivities(prisonCode: string, excludeArchived: boolean, user: ServiceUser): Promise<ActivityLite[]> {
    return this.get({
      path: `/prison/${prisonCode}/activities`,
      query: { excludeArchived },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getSchedulesOfActivity(activityId: number, user: ServiceUser): Promise<ActivityScheduleLite[]> {
    return this.get({
      path: `/activities/${activityId}/schedules`,
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
  ): Promise<ScheduledActivity[]> {
    return this.get({
      path: `/prisons/${prisonCode}/scheduled-instances`,
      query: {
        startDate: toDateString(startDate),
        endDate: toDateString(endDate),
        slot,
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

  postActivityCreation(createBody: ActivityCreateRequest, user: ServiceUser): Promise<Activity> {
    return this.post({
      path: `/activities`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: createBody,
    })
  }

  patchActivityUpdate(prisonCode: string, activityId: number, updateBody: ActivityUpdateRequest): Promise<Activity> {
    return this.patch({
      path: `/activities/${prisonCode}/activityId/${activityId}`,
      data: updateBody,
    })
  }

  patchAllocationUpdate(
    prisonCode: string,
    allocationId: number,
    updateBody: AllocationUpdateRequest,
  ): Promise<Allocation> {
    return this.patch({
      path: `/allocations/${prisonCode}/allocationId/${allocationId}`,
      data: updateBody,
    })
  }

  postAllocation(
    scheduleId: number,
    prisonerNumber: string,
    payBandId: number,
    user: ServiceUser,
    startDate: string,
    endDate: string,
  ): Promise<void> {
    return this.post({
      path: `/schedules/${scheduleId}/allocations`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: { prisonerNumber, payBandId, startDate, endDate },
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
    }).then(res => res as RolloutPrisonPlan)
  }

  getScheduledPrisonLocations(
    prisonCode: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<InternalLocation[]> {
    return this.get({
      path: `/prison/${prisonCode}/locations`,
      query: { date, timeSlot: period },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getActivitySchedules(
    prisonCode: string,
    locationId: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<ActivitySchedule[]> {
    return this.get({
      path: `/prison/${prisonCode}/schedules`,
      query: { locationId, date, timeSlot: period },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getActivitySchedule(id: number, user: ServiceUser): Promise<ActivitySchedule> {
    return this.get({
      path: `/schedules/${id}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getAttendances(id: number, user: ServiceUser): Promise<Attendance[]> {
    return this.get({
      path: `/scheduled-instances/${id}/attendances`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async updateAttendances(attendanceUpdates: AttendanceUpdateRequest[], user: ServiceUser): Promise<void> {
    return this.put(
      {
        path: '/attendances',
        data: attendanceUpdates,
      },
      user,
    )
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
    return this.get({
      path: `/schedules/${scheduleId}/allocations`,
      query: { activeOnly: true },
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

  async getAppointment(appointmentId: number, user: ServiceUser): Promise<Appointment> {
    return this.get({
      path: `/appointments/${appointmentId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getAppointmentDetails(appointmentId: number, user: ServiceUser): Promise<AppointmentDetails> {
    return this.get({
      path: `/appointment-details/${appointmentId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async getAppointmentOccurrenceDetails(
    appointmentOccurrenceId: number,
    user: ServiceUser,
  ): Promise<AppointmentOccurrenceDetails> {
    return this.get({
      path: `/appointment-occurrence-details/${appointmentOccurrenceId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
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

  async postCreateAppointment(appointment: AppointmentCreateRequest, user: ServiceUser): Promise<Appointment> {
    return this.post({
      path: `/appointments`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: appointment,
    })
  }

  async postCreateBulkAppointment(
    bulkAppointments: BulkAppointmentsRequest,
    user: ServiceUser,
  ): Promise<BulkAppointment> {
    return this.post({
      path: `/bulk-appointments`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: bulkAppointments,
    })
  }

  async getBulkAppointmentDetails(bulkAppointmentId: number, user: ServiceUser): Promise<BulkAppointmentDetails> {
    return this.get({
      path: `/bulk-appointment-details/${bulkAppointmentId}`,
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

  async editAppointmentOccurrence(
    occurrenceId: number,
    occurrenceDetails: AppointmentOccurrenceUpdateRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.patch({
      path: `/appointment-occurrences/${occurrenceId}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: occurrenceDetails,
    })
  }

  getActivityCandidates(
    scheduleId: number,
    user: ServiceUser,
    suitableIncentiveLevel?: string[],
    suitableRiskLevel?: string[],
    suitableForEmployed?: boolean,
    search?: string,
    page?: number,
  ): Promise<PageActivityCandidate> {
    return this.get({
      path: `/schedules/${scheduleId}/candidates`,
      query: {
        suitableIncentiveLevel,
        suitableRiskLevel,
        suitableForEmployed,
        search,
        page,
        size: 5,
      },
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  getAllAttendance(sessionDate: Date, user: ServiceUser): Promise<AllAttendance[]> {
    return this.get({
      path: `/attendances/${user.activeCaseLoadId}/${toDateString(sessionDate)}`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
    })
  }

  async searchAppointmentOccurrences(
    prisonCode: string,
    searchRequest: AppointmentOccurrenceSearchRequest,
    user: ServiceUser,
  ): Promise<AppointmentOccurrenceSearchResult[]> {
    return this.post({
      path: `/appointment-occurrences/${prisonCode}/search`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: searchRequest,
    })
  }

  async cancelAppointmentOccurrence(
    occurrenceId: number,
    cancelRequest: AppointmentOccurrenceCancelRequest,
    user: ServiceUser,
  ): Promise<void> {
    return this.put({
      path: `/appointment-occurrences/${occurrenceId}/cancel`,
      authToken: user.token,
      headers: CASELOAD_HEADER(user.activeCaseLoadId),
      data: cancelRequest,
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
}
