import AbstractHmppsRestClient from './abstractHmppsRestClient'
import config, { ApiConfig } from '../config'
import { ServiceUser } from '../@types/express'
import {
  ActivitySchedule,
  Attendance,
  AttendanceUpdateRequest,
  InternalLocation,
  RolloutPrison,
} from '../@types/activitiesAPI/types'

export default class ActivitiesApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Activities Management API', config.apis.activitiesApi as ApiConfig)
  }

  async getRolloutPrison(prisonCode: string, user: ServiceUser): Promise<RolloutPrison> {
    return this.get({
      path: `/prisons/${prisonCode}`,
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
      path: `/prisons/${prisonCode}/locations`,
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
