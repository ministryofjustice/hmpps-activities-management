import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { InmateDetail } from '../@types/prisonApiImport/types'
import { ServiceUser } from '../@types/express'

export default class PrisonApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Prison API', config.apis.prisonApi as ApiConfig)
  }

  async getInmateDetail(nomsId: string, user: ServiceUser): Promise<InmateDetail> {
    return this.get({ path: `/api/offenders/${nomsId}` }, user)
  }
}
