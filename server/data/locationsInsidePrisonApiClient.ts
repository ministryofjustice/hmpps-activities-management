import config from '../config'
import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { ServiceUser } from '../@types/express'
import { Location } from '../@types/locationsInsidePrisonApi/types'

export default class LocationsInsidePrisonApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Locations Inside Prison API', config.apis.locationsInsidePrisonApi)
  }

  public fetchLocationById(id: string, user: ServiceUser): Promise<Location> {
    return this.get({ path: `/locations/${id}` }, user)
  }

  public fetchLocationByKey(key: string, user: ServiceUser): Promise<Location> {
    return this.get({ path: `/locations/key/${key}` }, user)
  }
}
