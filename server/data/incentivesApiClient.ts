import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import logger from '../../logger'
import config from '../config'
import { ServiceUser } from '../@types/express'
import { IncentiveLevel, IepSummary } from '../@types/incentivesApi/types'

export default class IncentivesApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Incentives API', config.apis.incentivesApi, logger, authenticationClient)
  }

  getIncentiveLevels(prisonId: string, user: ServiceUser): Promise<IncentiveLevel[]> {
    return this.get({ path: `/incentive/prison-levels/${prisonId}` }, asSystem(user.username))
  }

  getPrisonerIepSummary(prisonerNumber: string, user: ServiceUser): Promise<IepSummary> {
    return this.get({ path: `/incentive-reviews/prisoner/${prisonerNumber}` }, asSystem(user.username))
  }
}
