import config from '../config'
import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { ServiceUser } from '../@types/express'

type NomisDpsLocationMapping = {
  dpsLocationId: string
  nomisLocationId: number
}

export default class NomisMappingClient extends AbstractHmppsRestClient {
  constructor() {
    super('Nomis Mapping Client', config.apis.nomisMapping)
  }

  public getNomisLocationMappingByDpsLocationId(
    dpsLocationId: string,
    user: ServiceUser,
  ): Promise<NomisDpsLocationMapping> {
    return this.get({ path: `/api/locations/dps/${dpsLocationId}` }, user)
  }

  public getNomisLocationMappingByNomisLocationId(
    nomisLocationId: number,
    user: ServiceUser,
  ): Promise<NomisDpsLocationMapping> {
    return this.get({ path: `/api/locations/nomis/${nomisLocationId}` }, user)
  }
}
