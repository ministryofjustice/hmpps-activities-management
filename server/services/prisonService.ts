import _ from 'lodash'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import { ReferenceCode, AgencyPrisonerPayProfile, Alert } from '../@types/prisonApiImport/types'
import { PagePrisoner, Prisoner } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'

import { LocationLenient } from '../@types/prisonApiImportCustom'
import IncentivesApiClient from '../data/incentivesApiClient'
import { IepSummary, IncentiveLevel } from '../@types/incentivesApi/types'

export default class PrisonService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
    private readonly incentivesApiClient: IncentivesApiClient,
  ) {}

  async getInmates(prisonCode: string, user: ServiceUser): Promise<PagePrisoner> {
    return this.prisonerSearchApiClient.getInmates(prisonCode, 0, 20, user)
  }

  getIncentiveLevels(prisonId: string, user: ServiceUser): Promise<IncentiveLevel[]> {
    return this.incentivesApiClient.getIncentiveLevels(prisonId, user)
  }

  getPrisonerIepSummary(prisonerNumber: string, user: ServiceUser): Promise<IepSummary> {
    return this.incentivesApiClient.getPrisonerIepSummary(prisonerNumber, user)
  }

  async searchPrisonInmates(term: string, user: ServiceUser): Promise<PagePrisoner> {
    return this.prisonerSearchApiClient.searchPrisonInmates(term, user.activeCaseLoadId, user)
  }

  async searchInmatesByPrisonerNumbers(prisonerNumbers: string[], user: ServiceUser): Promise<Prisoner[]> {
    // Prisoner search has a maximum number of prisoner numbers allowed of 1000. Therefore, we make multiple
    // batched calls with a max batch size of 1000
    if (prisonerNumbers.length < 1) return []
    return Promise.all(
      _.chain(prisonerNumbers)
        .uniq()
        .chunk(1000)
        .map(batch => this.prisonerSearchApiClient.searchByPrisonerNumbers({ prisonerNumbers: batch }, user))
        .value(),
    ).then(result => result.flat())
  }

  async getInmateByPrisonerNumber(prisonerNumber: string, user: ServiceUser): Promise<Prisoner> {
    return this.prisonerSearchApiClient.getByPrisonerNumber(prisonerNumber, user)
  }

  async getEventLocations(prisonCode: string, user: ServiceUser): Promise<LocationLenient[]> {
    return this.prisonApiClient.getEventLocations(prisonCode, user)
  }

  async getInternalLocationByKey(key: string, user: ServiceUser): Promise<LocationLenient> {
    return this.prisonApiClient.getInternalLocationByKey(key, user)
  }

  async getReferenceCodes(domain: string, user: ServiceUser): Promise<ReferenceCode[]> {
    return this.prisonApiClient.getReferenceCodes(domain, user)
  }

  async getPayProfile(prisonCode: string): Promise<AgencyPrisonerPayProfile> {
    return this.prisonApiClient.getPayProfile(prisonCode)
  }

  async getPrisonerAlerts(offenderNumbers: string[], prisonCode: string, user: ServiceUser): Promise<Alert[]> {
    return this.prisonApiClient.getPrisonersAlerts(offenderNumbers, prisonCode, user)
  }
}
