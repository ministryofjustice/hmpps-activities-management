import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { ServiceUser } from '../@types/express'
import { IepLevel, IepSummary } from '../@types/incentivesApi/types'

export default class IncentivesApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Incentives API', config.apis.incentivesApi as ApiConfig)
  }

  getIncentiveLevels(prisonId: string, user: ServiceUser): Promise<IepLevel[]> {
    return this.get({ path: `/iep/levels/${prisonId}` }, user)
  }

  getPrisonerIepSummary(prisonerNumber: string, user: ServiceUser): Promise<IepSummary> {
    return this.get({ path: `/iep/reviews/prisoner/${prisonerNumber}` }, user)
  }
}
