import AbstractHmppsRestClient from './abstractHmppsRestClient'
import config, { ApiConfig } from '../config'
import { ServiceUser } from '../@types/express'
import { NonAssociation, PrisonerNonAssociations } from '../@types/nonAssociationsApi/types'

export default class NonAssociationsApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Non-Associations API', config.apis.nonAssociationsApi as ApiConfig)
  }

  async getNonAssociationsBetween(prisonerNumbers: string[], user: ServiceUser): Promise<NonAssociation[]> {
    return this.post(
      {
        path: `/non-associations/between`,
        data: prisonerNumbers,
      },
      user,
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
      user,
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
      user,
    )
  }
}
