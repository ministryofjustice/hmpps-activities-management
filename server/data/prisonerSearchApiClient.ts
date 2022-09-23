import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'

export default class PrisonerSearchApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Prisoner search API', config.apis.prisonerSearchApi as ApiConfig)
  }

  async searchInmates(prisonerSearchCriteria: PrisonerSearchCriteria, user: ServiceUser): Promise<Prisoner[]> {
    return this.post<Prisoner[]>(
      {
        path: '/prisoner-search/match-prisoners',
        data: prisonerSearchCriteria,
      },
      user,
    )
  }
}
