import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { ServiceUser } from '../@types/express'
import { AttendancesResponse } from '../@types/whereaboutsApiImport/types'

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
}
