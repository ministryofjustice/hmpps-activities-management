import { Readable } from 'stream'
import { RestClient, asSystem, asUser } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import logger from '../../logger'
import config from '../config'

import { ReferenceCode, AgencyPrisonerPayProfile } from '../@types/prisonApiImport/types'
import { ServiceUser } from '../@types/express'
import { LocationLenient } from '../@types/prisonApiImportCustom'

export default class PrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prison API', config.apis.prisonApi, logger, authenticationClient)
  }

  async getReferenceCodes(domain: string, user: ServiceUser): Promise<ReferenceCode[]> {
    return this.get({ path: `/api/reference-domains/domains/${domain}/codes` }, asUser(user.token))
  }

  async getPayProfile(prisonCode: string): Promise<AgencyPrisonerPayProfile> {
    return this.get(
      {
        path: `/api/agencies/${prisonCode}/pay-profile`,
      },
      asSystem(),
    )
  }

  // TODO: SAA-2388 - remove when complete
  async getInternalLocationByKey(key: string, user: ServiceUser): Promise<LocationLenient> {
    return this.get({ path: `/api/locations/code/${key}` }, asUser(user.token))
  }

  getPrisonerImage(prisonerNumber: string): Promise<Readable> {
    return this.stream(
      {
        path: `/api/bookings/offenderNo/${prisonerNumber}/image/data`,
      },
      asSystem(),
    ) as Promise<Readable>
  }
}
