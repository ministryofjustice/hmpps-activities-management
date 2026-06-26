import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import logger from '../../logger'
import config from '../config'
import { ServiceUser } from '../@types/express'

type NomisDpsLocationMapping = {
  dpsLocationId: string
  nomisLocationId: number
}

export default class NomisMappingClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Nomis Mapping Client', config.apis.nomisMapping, logger, authenticationClient)
  }

  public getNomisLocationMappingByDpsLocationId(
    dpsLocationId: string,
    user: ServiceUser,
  ): Promise<NomisDpsLocationMapping> {
    return this.get({ path: `/api/locations/dps/${dpsLocationId}` }, asSystem(user.username))
  }

  public getNomisLocationMappingByNomisLocationId(
    nomisLocationId: number,
    user: ServiceUser,
  ): Promise<NomisDpsLocationMapping> {
    return this.get({ path: `/api/locations/nomis/${nomisLocationId}` }, asSystem(user.username))
  }
}
