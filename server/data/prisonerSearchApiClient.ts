import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import {
  PagePrisoner,
  Prisoner,
  PrisonerNumbers,
  PrisonerSearchCriteria,
} from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'

export default class PrisonerSearchApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Prisoner search API', config.apis.prisonerSearchApi as ApiConfig)
  }

  async getInmates(
    prisonCode: string,
    page: number,
    size: number,
    user: ServiceUser,
    includeRestricted?: boolean,
  ): Promise<PagePrisoner> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      'include-restricted-patients': includeRestricted ? 'true' : 'false',
    })
    return this.get(
      {
        path: `/prisoner-search/prison/${prisonCode}`,
        query: searchParams.toString(),
      },
      user,
    )
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
