import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { Prison } from '../@types/prisonRegisterApiImport/types'
import { ServiceUser } from '../@types/express'

export default class PrisonRegisterApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Prison register API', config.apis.prisonRegisterApi as ApiConfig)
  }

  async getPrisonInformation(prisonId: string, user: ServiceUser): Promise<Prison> {
    return this.get(
      {
        path: `/prisons/id/${prisonId}`,
      },
      user,
    )
  }
}
