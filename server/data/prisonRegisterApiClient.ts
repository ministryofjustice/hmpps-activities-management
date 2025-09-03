import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config, { ApiConfig } from '../config'
import { Prison } from '../@types/prisonRegisterApiImport/types'
import logger from '../../logger'

export default class PrisonRegisterApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prison register API', config.apis.prisonRegisterApi as ApiConfig, logger, authenticationClient)
  }

  async getPrisonInformation(prisonId: string): Promise<Prison> {
    return this.get(
      {
        path: `/prisons/id/${prisonId}`,
      },
      asSystem(),
    )
  }
}
