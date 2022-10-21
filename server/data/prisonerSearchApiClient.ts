import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { Prisoner, PrisonerNumbers, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'

export default class PrisonerSearchApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Prisoner search API', config.apis.prisonerSearchApi as ApiConfig)
  }

  async searchInmates(prisonerSearchCriteria: PrisonerSearchCriteria, user: ServiceUser): Promise<Prisoner[]> {
    return this.post(
      {
        path: '/prisoner-search/match-prisoners',
        data: prisonerSearchCriteria,
      },
      user,
    )
  }

  async searchByPrisonerNumbers(prisonerNumbers: PrisonerNumbers, user: ServiceUser): Promise<Prisoner[]> {
    return this.post(
      {
        path: '/prisoner-search/prisoner-numbers',
        data: prisonerNumbers,
      },
      user,
    )
  }
}
