import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { ServiceUser } from '../@types/express'
import { AttendanceDto, AttendancesResponse } from '../@types/whereaboutsApiImport/types'
import { OffenderActivityId } from '../@types/dps'
import {
  AbsentReasonsDtoLenient,
  CreateAttendanceDtoLenient,
  UpdateAttendanceDtoLenient,
} from '../@types/whereaboutsApiImportCustom'

export default class WhereaboutsApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Whereabouts API', config.apis.whereaboutsApi as ApiConfig)
  }

  async getAttendance(
    prisonId: string,
    locationId: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<AttendancesResponse> {
    return this.get({
      path: `/attendances/${prisonId}/${locationId}`,
      query: { date, period },
      authToken: user.token,
    })
  }

  async createAttendance(
    date: string,
    attendance: CreateAttendanceDtoLenient,
    user: ServiceUser,
  ): Promise<AttendanceDto> {
    if (!attendance || !attendance.bookingId) {
      throw new Error('Booking ID is missing')
    }
    return this.post({
      path: '/attendance',
      data: {
        eventDate: date,
        ...attendance,
      },
      authToken: user.token,
    })
  }

  async updateAttendance(
    id: number,
    date: string,
    attendance: UpdateAttendanceDtoLenient,
    user: ServiceUser,
  ): Promise<AttendanceDto> {
    return this.put({
      path: `/attendance/${id}`,
      data: {
        id,
        eventDate: date,
        ...attendance,
      },
      authToken: user.token,
    })
  }

  async batchUpdateAttendance(
    prisonId: string,
    locationId: string,
    date: string,
    period: string,
    activities: OffenderActivityId[],
    attended: boolean,
    paid: boolean,
    reason: string,
    comments: string,
    user: ServiceUser,
  ): Promise<AttendancesResponse> {
    return this.post({
      path: '/attendances',
      data: {
        prisonId,
        eventLocationId: locationId,
        eventDate: date,
        period,
        attended,
        paid,
        reason,
        comments,
        bookingActivities: activities,
      },
      authToken: user.token,
    })
  }

  async getAbsenceReasons(user: ServiceUser): Promise<AbsentReasonsDtoLenient> {
    return this.get({
      path: '/absence-reasons',
      authToken: user.token,
    })
  }
}
