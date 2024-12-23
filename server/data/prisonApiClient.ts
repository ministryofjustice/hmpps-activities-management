import { Readable } from 'stream'
import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { ReferenceCode, AgencyPrisonerPayProfile, Alert } from '../@types/prisonApiImport/types'
import { ServiceUser } from '../@types/express'
import { LocationLenient } from '../@types/prisonApiImportCustom'

export default class PrisonApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Prison API', config.apis.prisonApi as ApiConfig)
  }

  async getEventLocations(prisonCode: string, user: ServiceUser): Promise<LocationLenient[]> {
    return this.get({
      path: `/api/agencies/${prisonCode}/eventLocations`,
      authToken: user.token,
    })
  }

  async getReferenceCodes(domain: string, user: ServiceUser): Promise<ReferenceCode[]> {
    return this.get({
      path: `/api/reference-domains/domains/${domain}/codes`,
      authToken: user.token,
    })
  }

  async getPayProfile(prisonCode: string): Promise<AgencyPrisonerPayProfile> {
    return this.get({
      path: `/api/agencies/${prisonCode}/pay-profile`,
    })
  }

  // TODO: Move to prisonSearchApiClient once alerts endpoint is available
  async getPrisonersAlerts(offenderNumbers: string[], prisonCode: string, user: ServiceUser): Promise<Alert[]> {
    return this.post({
      path: `/api/bookings/offenderNo/${prisonCode}/alerts`,
      data: offenderNumbers,
      authToken: user.token,
    })
  }

  async getInternalLocationByKey(key: string, user: ServiceUser): Promise<LocationLenient> {
    return this.get({ path: `/api/locations/code/${key}`, authToken: user.token })
  }

  getPrisonerImage(prisonerNumber: string, user: ServiceUser): Promise<Readable> {
    return this.stream({
      path: `/api/bookings/offenderNo/${prisonerNumber}/image/data`,
      authToken: user.token,
    }) as Promise<Readable>
  }
}
