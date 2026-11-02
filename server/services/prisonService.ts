import _ from 'lodash'
import { Readable } from 'stream'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import { AgencyPrisonerPayProfile, ReferenceCode } from '../@types/prisonApiImport/types'
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

  getIncentiveLevels(prisonId: string, user: ServiceUser): Promise<IncentiveLevel[]> {
    return this.incentivesApiClient.getIncentiveLevels(prisonId, user)
  }

  getPrisonerIepSummary(prisonerNumber: string, user: ServiceUser): Promise<IepSummary> {
    return this.incentivesApiClient.getPrisonerIepSummary(prisonerNumber, user)
  }

  async searchPrisonInmates(term: string, user: ServiceUser): Promise<PagePrisoner> {
    return this.prisonerSearchApiClient.searchPrisonInmates(term, user.activeCaseLoadId, user)
  }

  async searchPrisonerNumbers(searchTerm: string, user: ServiceUser): Promise<string[]> {
    const term = searchTerm.trim()
    if (/^[a-z]\d{4}[a-z]{2}$/i.test(term)) return [term.toUpperCase()]

    const words = term
      .toLowerCase()
      .split(/[\s,]+/)
      .filter(Boolean)
    if (!words.length) return []

    const prisonerNumbers = new Set<string>()
    let page = 0
    let totalPages = 1
    do {
      // eslint-disable-next-line no-await-in-loop
      const results = await this.prisonerSearchApiClient.searchPrisoners(words.join(' '), page, user)
      results.content?.forEach(prisoner => {
        const nameAndNumber = [prisoner.firstName, prisoner.middleNames, prisoner.lastName, prisoner.prisonerNumber]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (words.every(word => nameAndNumber.includes(word))) prisonerNumbers.add(prisoner.prisonerNumber)
      })
      totalPages = results.totalPages || 0
      page += 1
    } while (page < totalPages)

    return [...prisonerNumbers]
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

  async getInternalLocationByKey(key: string, user: ServiceUser): Promise<LocationLenient> {
    return this.prisonApiClient.getInternalLocationByKey(key, user)
  }

  async getReferenceCodes(domain: string, user: ServiceUser): Promise<ReferenceCode[]> {
    return this.prisonApiClient.getReferenceCodes(domain, user)
  }

  async getPayProfile(prisonCode: string): Promise<AgencyPrisonerPayProfile> {
    return this.prisonApiClient.getPayProfile(prisonCode)
  }

  async getPrisonerImage(prisonerNumber: string): Promise<Readable> {
    return this.prisonApiClient.getPrisonerImage(prisonerNumber)
  }

  async searchPrisonersByLocationPrefix(
    prisonCode: string,
    locationPrefix: string,
    page: number,
    size: number,
    user: ServiceUser,
  ): Promise<PagePrisoner> {
    return this.prisonerSearchApiClient.searchPrisonersByLocationPrefix(prisonCode, locationPrefix, page, size, user)
  }
}
