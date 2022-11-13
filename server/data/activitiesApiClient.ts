import AbstractHmppsRestClient from './abstractHmppsRestClient'
import config, { ApiConfig } from '../config'
import { ServiceUser } from '../@types/express'
import {
  ActivityCategory,
  ActivityLite,
  ActivitySchedule,
  Attendance,
  AttendanceUpdateRequest,
  CapacityAndAllocated,
  InternalLocation,
  RolloutPrison,
} from '../@types/activitiesAPI/types'

export default class ActivitiesApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Activities Management API', config.apis.activitiesApi as ApiConfig)
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

  async getActivityCapacity(activityId: number, user: ServiceUser): Promise<CapacityAndAllocated> {
    return this.get({
      path: `/activities/${activityId}/capacity`,
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
      path: `/schedules/${prisonCode}`,
      query: { locationId, date, timeSlot: period },
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
    return this.put({
      path: '/attendances',
      data: attendanceUpdates,
      authToken: user.token,
    })
  }
}
