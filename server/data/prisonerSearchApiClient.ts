import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import {
  PagePrisoner,
  Prisoner,
  PrisonerNumbers,
  PrisonerSearchQuery,
} from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'

export default class PrisonerSearchApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Prisoner search API', config.apis.prisonerSearchApi as ApiConfig)
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

  async getByPrisonerNumber(prisonerNumber: string, user: ServiceUser): Promise<Prisoner> {
    return this.get(
      {
        path: `/prisoner/${prisonerNumber}`,
      },
      user,
    )
  }

  async searchPrisonInmates(searchTerm: string, prisonCode: string, user: ServiceUser): Promise<PagePrisoner> {
    const query: PrisonerSearchQuery = {
      term: searchTerm,
      size: 50,
    }
    return this.get(
      {
        path: `/prison/${prisonCode}/prisoners`,
        query,
      },
      user,
    )
  }

  async searchPrisonersByLocationPrefix(
    prisonCode: string,
    locationPrefix: string,
    page: number,
    size: number,
    user: ServiceUser,
  ): Promise<PagePrisoner> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      cellLocationPrefix: locationPrefix,
      sort: 'cellLocation',
    })
    return this.get(
      {
        path: `/prison/${prisonCode}/prisoners`,
        query: searchParams.toString(),
      },
      user,
    )
  }
}
