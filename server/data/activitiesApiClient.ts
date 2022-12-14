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
  CapacityAndAllocated,
  InternalLocation,
  PrisonerScheduledEvents,
  RolloutPrison,
  ScheduledActivity,
  LocationGroup,
  LocationPrefix,
  Allocation,
  PrisonerAllocations,
  Activity,
  ActivityCreateRequest,
} from '../@types/activitiesAPI/types'
import { toDateString } from '../utils/utils'
import TimeSlot from '../enum/timeSlot'

export default class ActivitiesApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Activities Management API', config.apis.activitiesApi as ApiConfig)
  }

  getActivity(activityId: number, user: ServiceUser): Promise<Activity> {
    return this.get({
      path: `/activities/${activityId}`,
      authToken: user.token,
    })
  }

  async getActivityCategories(user: ServiceUser): Promise<ActivityCategory[]> {
    return this.get({
      path: `/activity-categories`,
      authToken: user.token,
    })
  }

  async getCategoryCapacity(prisonCode: string, categoryId: number, user: ServiceUser): Promise<CapacityAndAllocated> {
    return this.get({
      path: `/prison/${prisonCode}/activity-categories/${categoryId}/capacity`,
      authToken: user.token,
    })
  }

  async getActivitiesInCategory(prisonCode: string, categoryId: number, user: ServiceUser): Promise<ActivityLite[]> {
    return this.get({
      path: `/prison/${prisonCode}/activity-categories/${categoryId}/activities`,
      authToken: user.token,
    })
  }

  async getActivities(prisonCode: string, user: ServiceUser): Promise<ActivityLite[]> {
    return this.get({
      path: `/prison/${prisonCode}/activities`,
      authToken: user.token,
    })
  }

  async getActivityCapacity(activityId: number, user: ServiceUser): Promise<CapacityAndAllocated> {
    return this.get({
      path: `/activities/${activityId}/capacity`,
      authToken: user.token,
    })
  }

  async getSchedulesOfActivity(activityId: number, user: ServiceUser): Promise<ActivityScheduleLite[]> {
    return this.get({
      path: `/activities/${activityId}/schedules`,
      authToken: user.token,
    })
  }

  async getScheduleCapacity(scheduleId: number, user: ServiceUser): Promise<CapacityAndAllocated> {
    return this.get({
      path: `/schedules/${scheduleId}/capacity`,
      authToken: user.token,
    })
  }

  getScheduledActivitiesAtPrison(
    prisonCode: string,
    startDate: Date,
    endDate: Date,
    slot: TimeSlot,
    user: ServiceUser,
  ): Promise<ScheduledActivity[]> {
    return this.get({
      path: `/prisons/${prisonCode}/scheduled-instances`,
      query: {
        startDate: toDateString(startDate),
        endDate: toDateString(endDate),
        slot,
      },
      authToken: user.token,
    })
  }

  getScheduledActivity(id: number, user: ServiceUser): Promise<ScheduledActivity> {
    return this.get({
      path: `/scheduled-instances/${id}`,
      authToken: user.token,
    })
  }

  postActivityCreation(createBody: ActivityCreateRequest, user: ServiceUser): Promise<void> {
    return this.post({ path: `/activities`, authToken: user.token, data: createBody })
  }

  postAllocation(scheduleId: number, prisonerNumber: string, payBand: string, user: ServiceUser): Promise<void> {
    return this.post({
      path: `/schedules/${scheduleId}/allocations`,
      authToken: user.token,
      data: { prisonerNumber, payBand },
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
    })
  }

  getScheduledEventsByPrisonerNumbers(
    prisonCode: string,
    date: string,
    timeSlot: string,
    prisonerNumbers: string[],
    user: ServiceUser,
  ): Promise<PrisonerScheduledEvents> {
    return this.post({
      path: `/scheduled-events/prison/${prisonCode}`,
      query: { date, timeSlot },
      data: prisonerNumbers,
      authToken: user.token,
    })
  }

  async getRolloutPrison(prisonCode: string, user: ServiceUser): Promise<RolloutPrison> {
    return this.get({
      path: `/rollout/${prisonCode}`,
      authToken: user.token,
    })
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
    })
  }

  async getActivitySchedule(id: number, user: ServiceUser): Promise<ActivitySchedule> {
    return this.get({
      path: `/schedules/${id}`,
      authToken: user.token,
    })
  }

  async getAttendances(id: number, user: ServiceUser): Promise<Attendance[]> {
    return this.get({
      path: `/scheduled-instances/${id}/attendances`,
      authToken: user.token,
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
    })
  }

  async getAllocations(scheduleId: number, user: ServiceUser): Promise<Allocation[]> {
    return this.get({
      path: `/schedules/${scheduleId}/allocations`,
      authToken: user.token,
    })
  }

  async getPrisonerAllocations(
    prisonCode: string,
    prisonerNumbers: string[],
    user: ServiceUser,
  ): Promise<PrisonerAllocations[]> {
    return this.post({
      path: `/prisons/${prisonCode}/prisoner-allocations`,
      data: prisonerNumbers,
      authToken: user.token,
    })
  }
}
