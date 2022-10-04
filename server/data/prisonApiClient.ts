import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { InmateDetail, PrisonApiUserDetail, Location, CaseLoad } from '../@types/prisonApiImport/types'
import { ServiceUser } from '../@types/express'

export default class PrisonApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Prison API', config.apis.prisonApi as ApiConfig)
  }

  async getInmateDetail(nomsId: string, user: ServiceUser): Promise<InmateDetail> {
    return this.get({ path: `/api/offenders/${nomsId}` }, user)
  }

  async getUser(user: ServiceUser): Promise<PrisonApiUserDetail> {
    return this.get({ path: '/api/users/me', authToken: user.token })
  }

  async getUserCaseLoads(user: ServiceUser): Promise<CaseLoad[]> {
    return this.get({ path: '/api/users/me/caseLoads', authToken: user.token })
  }

  async setActiveCaseLoad(caseLoadId: string, user: ServiceUser): Promise<void> {
    const data = {
      caseLoadId,
    }

    return this.put({ path: '/api/users/me/activeCaseLoad', data, authToken: user.token })
  }

  async searchActivityLocations(
    prisonCode: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<Location[]> {
    return this.get({
      path: `/api/agencies/${prisonCode}/eventLocationsBooked`,
      query: { bookedOnDay: date, timeSlot: period },
      authToken: user.token,
    })
  }
}
