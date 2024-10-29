import { ServiceUser } from '../@types/express'
import NonAssociationsApiClient from '../data/nonAssociationsApiClient'
import { NonAssociation } from '../@types/nonAssociationsApi/types'

export default class NonAssociationsService {
  constructor(private readonly nonAssociationsApiClient: NonAssociationsApiClient) {}

  async getNonAssociationsBetween(prisonerNumbers: string[], user: ServiceUser): Promise<NonAssociation[]> {
    return this.nonAssociationsApiClient.getNonAssociationsBetween(prisonerNumbers, user)
  }
}
