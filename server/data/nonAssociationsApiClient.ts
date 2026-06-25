import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import logger from '../../logger'
import config from '../config'
import { ServiceUser } from '../@types/express'
import { NonAssociation, PrisonerNonAssociations } from '../@types/nonAssociationsApi/types'

export default class NonAssociationsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Non-Associations API', config.apis.nonAssociationsApi, logger, authenticationClient)
  }

  async getNonAssociationsBetween(prisonerNumbers: string[], user: ServiceUser): Promise<NonAssociation[]> {
    return this.post(
      {
        path: `/non-associations/between`,
        data: prisonerNumbers,
      },
      asSystem(user.username),
    )
  }

  async getNonAssociationsInvolving(prisonerNumbers: string[], user: ServiceUser): Promise<NonAssociation[]> {
    return this.post(
      {
        path: `/non-associations/involving`,
        data: prisonerNumbers,
        query: {
          prisonId: user.activeCaseLoadId,
        },
      },
      asSystem(user.username),
    )
  }

  async getNonAssociationsByPrisonerNumber(
    prisonerNumber: string,
    user: ServiceUser,
  ): Promise<PrisonerNonAssociations> {
    return this.get(
      {
        path: `/prisoner/${prisonerNumber}/non-associations`,
      },
      asSystem(user.username),
    )
  }
}
