import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import {
  InmateDetail,
  InmateBasicDetails,
  ReferenceCode,
  AgencyPrisonerPayProfile,
} from '../@types/prisonApiImport/types'
import { PagePrisoner, Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearchImport/types'
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

  async getInmate(nomisId: string, user: ServiceUser): Promise<InmateDetail> {
    return this.prisonApiClient.getInmateDetail(nomisId, user)
  }

  async getInmates(prisonCode: string, user: ServiceUser): Promise<PagePrisoner> {
    return this.prisonerSearchApiClient.getInmates(prisonCode, 0, 20, user)
  }

  getIncentiveLevels(prisonId: string, user: ServiceUser): Promise<IncentiveLevel[]> {
    return this.incentivesApiClient.getIncentiveLevels(prisonId, user)
  }

  getPrisonerIepSummary(prisonerNumber: string, user: ServiceUser): Promise<IepSummary> {
    return this.incentivesApiClient.getPrisonerIepSummary(prisonerNumber, user)
  }

  async searchInmates(prisonerSearchCriteria: PrisonerSearchCriteria, user: ServiceUser): Promise<Prisoner[]> {
    return this.prisonerSearchApiClient.searchInmates(prisonerSearchCriteria, user)
  }

  async searchPrisonInmates(term: string, user: ServiceUser): Promise<PagePrisoner> {
    return this.prisonerSearchApiClient.searchPrisonInmates(term, user.activeCaseLoadId, user)
  }

  async searchInmatesByPrisonerNumbers(prisonerNumbers: string[], user: ServiceUser): Promise<Prisoner[]> {
    if (prisonerNumbers.length < 1) {
      return []
    }
    return this.prisonerSearchApiClient.searchByPrisonerNumbers({ prisonerNumbers }, user)
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
