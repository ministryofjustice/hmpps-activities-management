import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import { Prison } from '../@types/prisonRegisterApiImport/types'
import { InmateDetail, Location } from '../@types/prisonApiImport/types'
import { Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'

export default class PrisonService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
    private readonly prisonRegisterApiClient: PrisonRegisterApiClient,
  ) {}

  async getPrison(prisonCode: string, user: ServiceUser): Promise<Prison> {
    return this.prisonRegisterApiClient.getPrison(prisonCode, user)
  }

  async getInmate(nomisId: string, user: ServiceUser): Promise<InmateDetail> {
    return this.prisonApiClient.getInmateDetail(nomisId, user)
  }

  async searchInmates(prisonerSearchCriteria: PrisonerSearchCriteria, user: ServiceUser): Promise<Prisoner[]> {
    return this.prisonerSearchApiClient.searchInmates(prisonerSearchCriteria, user)
  }

  async getActivityLocations(prisonCode: string, date: string, period: string, user: ServiceUser): Promise<Location[]> {
    return this.prisonApiClient.searchActivityLocations(prisonCode, date, period, user)
  }
}
