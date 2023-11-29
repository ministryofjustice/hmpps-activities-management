import _ from 'lodash'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import {
  InmateDetail,
  InmateBasicDetails,
  ReferenceCode,
  AgencyPrisonerPayProfile,
} from '../@types/prisonApiImport/types'
import { PagePrisoner, Prisoner } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'

import { LocationLenient } from '../@types/prisonApiImportCustom'
import IncentivesApiClient from '../data/incentivesApiClient'
import { IepSummary, IncentiveLevel } from '../@types/incentivesApi/types'
import { ActivityPay } from '../@types/activitiesAPI/types'

export default class PrisonService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
    private readonly incentivesApiClient: IncentivesApiClient,
  ) {}

  async getInmate(nomisId: string, user: ServiceUser): Promise<InmateDetail> {
    return this.prisonApiClient.getInmateDetail(nomisId, user)
  }

  async getInmates(prisonCode: string, user: ServiceUser): Promise<PagePrisoner> {
    return this.prisonerSearchApiClient.getInmates(prisonCode, 0, 20, user)
  }

  getIncentiveLevels(prisonId: string, user: ServiceUser): Promise<IncentiveLevel[]> {
    return this.incentivesApiClient.getIncentiveLevels(prisonId, user)
  }

  async getMinimumIncentiveLevel(
    prisonId: string,
    user: ServiceUser,
    pay: ActivityPay[],
    flatPay: ActivityPay[],
  ): Promise<IncentiveLevel> {
    const incentiveLevels = await this.getIncentiveLevels(prisonId, user)
    if (flatPay.length > 0 || pay.length === 0) return incentiveLevels[0]
    return incentiveLevels.find(iep => pay.find(p => p.incentiveNomisCode === iep.levelCode)) ?? incentiveLevels[0]
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

  async getLocationsForEventType(prisonCode: string, eventType: string, user: ServiceUser): Promise<LocationLenient[]> {
    return this.prisonApiClient.getLocationsForEventType(prisonCode, eventType, user)
  }

  async searchActivityLocations(
    prisonCode: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<LocationLenient[]> {
    return this.prisonApiClient.searchActivityLocations(prisonCode, date, period, user)
  }

  async getInmateDetails(offenderNumbers: string[], user: ServiceUser): Promise<InmateBasicDetails[]> {
    return this.prisonApiClient.getInmateDetails(offenderNumbers, user)
  }

  async getReferenceCodes(domain: string, user: ServiceUser): Promise<ReferenceCode[]> {
    return this.prisonApiClient.getReferenceCodes(domain, user)
  }

  async getPayProfile(prisonCode: string): Promise<AgencyPrisonerPayProfile> {
    return this.prisonApiClient.getPayProfile(prisonCode)
  }
}
