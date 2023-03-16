import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import {
  InmateDetail,
  PrisonApiUserDetail,
  CaseLoad,
  InmateBasicDetails,
  ReferenceCode,
  Education,
} from '../@types/prisonApiImport/types'
import { ServiceUser } from '../@types/express'
import { LocationLenient } from '../@types/prisonApiImportCustom'

export default class PrisonApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Prison API', config.apis.prisonApi as ApiConfig)
  }

  async getInmateDetail(nomsId: string, user: ServiceUser): Promise<InmateDetail> {
    return this.get({ path: `/api/offenders/${nomsId}` }, user)
  }

  async getUser(user: ServiceUser): Promise<PrisonApiUserDetail> {
    return this.get({ path: '/api/users/me', authToken: user.token })
  }

  async getUserByUsername(username: string, user: ServiceUser): Promise<PrisonApiUserDetail> {
    return this.get({ path: `/api/users/${username}`, authToken: user.token })
  }

  async getUserCaseLoads(user: ServiceUser): Promise<CaseLoad[]> {
    return this.get({ path: '/api/users/me/caseLoads', authToken: user.token })
  }

  async setActiveCaseLoad(caseLoadId: string, user: ServiceUser): Promise<void> {
    const data = {
      caseLoadId,
    }

    return this.put({ path: '/api/users/me/activeCaseLoad', data, authToken: user.token })
  }

  async getEventLocations(prisonCode: string, user: ServiceUser): Promise<LocationLenient[]> {
    return this.get({
      path: `/api/agencies/${prisonCode}/eventLocations`,
      authToken: user.token,
    })
  }

  async getLocationsForEventType(prisonCode: string, eventType: string, user: ServiceUser): Promise<LocationLenient[]> {
    return this.get({
      path: `/api/agencies/${prisonCode}/locations`,
      query: { eventType },
      authToken: user.token,
    })
  }

  async searchActivityLocations(
    prisonCode: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<LocationLenient[]> {
    return this.get({
      path: `/api/agencies/${prisonCode}/eventLocationsBooked`,
      query: { bookedOnDay: date, timeSlot: period },
      authToken: user.token,
    })
  }

  async getInmateDetails(offenderNumbers: string[], user: ServiceUser): Promise<InmateBasicDetails[]> {
    return this.post({
      path: `/api/bookings/offenders`,
      data: offenderNumbers,
      authToken: user.token,
    })
  }

  async getReferenceCodes(domain: string, user: ServiceUser): Promise<ReferenceCode[]> {
    return this.get({
      path: `/api/reference-domains/domains/${domain}/codes`,
      authToken: user.token,
    })
  }

  async getEducations(prisonerNumbers: string[], user: ServiceUser): Promise<Education[]> {
    return this.post({
      path: `/api/education/prisoners`,
      data: prisonerNumbers,
      authToken: user.token,
    })
  }
}
