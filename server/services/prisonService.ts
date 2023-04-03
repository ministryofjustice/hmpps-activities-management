import _ from 'lodash'
import { isBefore } from 'date-fns'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import { InmateDetail, InmateBasicDetails, ReferenceCode, Education } from '../@types/prisonApiImport/types'
import { PagePrisoner, Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'

import { parseDate } from '../utils/utils'
import { LocationLenient } from '../@types/prisonApiImportCustom'
import IncentivesApiClient from '../data/incentivesApiClient'
import { IepLevel, IepSummary } from '../@types/incentivesApi/types'

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

  getIncentiveLevels(prisonId: string, user: ServiceUser): Promise<IepLevel[]> {
    return this.incentivesApiClient
      .getIncentiveLevels(prisonId, user)
      .then(ieps => ieps.filter(iep => iep.active))
      .then(ieps => _.sortBy(ieps, 'sequence'))
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

  async getLocationsForAppointments(prisonCode: string, user: ServiceUser): Promise<LocationLenient[]> {
    return this.prisonApiClient.getLocationsForEventType(prisonCode, 'APP', user)
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

  getEducations(
    prisonerNumber: string | string[],
    user: ServiceUser,
    excludeInFlightCertifications = true,
    filterDuplicateQualifications = true,
  ): Promise<Education[]> {
    const prisonerNumbers = [prisonerNumber].flat()
    return this.prisonApiClient
      .getEducations(prisonerNumbers, user)
      .then(edu =>
        edu.filter(
          e =>
            e.studyArea &&
            e.educationLevel &&
            (!excludeInFlightCertifications || isBefore(parseDate(e.endDate), new Date())),
        ),
      )
      .then(edu =>
        filterDuplicateQualifications ? _.uniqBy(edu, e => e.bookingId + e.studyArea + e.educationLevel) : edu,
      )
  }
}
