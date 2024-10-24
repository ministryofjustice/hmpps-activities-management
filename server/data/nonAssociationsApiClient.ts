import AbstractHmppsRestClient from './abstractHmppsRestClient'
import config, { ApiConfig } from '../config'
import { ServiceUser } from '../@types/express'
import { NonAssociation } from '../@types/nonAssociationsApi/types'

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
}
