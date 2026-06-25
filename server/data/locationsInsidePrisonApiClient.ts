import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import logger from '../../logger'
import config from '../config'
import { ServiceUser } from '../@types/express'
import { Location } from '../@types/locationsInsidePrisonApi/types'

export default class LocationsInsidePrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Locations Inside Prison API', config.apis.locationsInsidePrisonApi, logger, authenticationClient)
  }

  public fetchLocationById(id: string, user: ServiceUser): Promise<Location> {
    return this.get({ path: `/locations/${id}` }, asSystem(user.username))
  }

  public fetchLocationByKey(key: string, user: ServiceUser): Promise<Location> {
    return this.get({ path: `/locations/key/${key}` }, asSystem(user.username))
  }

  public fetchNonResidentialLocationsByUsageType(prisonCode: string, user: ServiceUser): Promise<Location[]> {
    return this.get(
      { path: `/locations/prison/${prisonCode}/non-residential-usage-type?formatLocalName=true` },
      asSystem(user.username),
    )
  }

  public fetchLocationsByNonResidentialUsageType(
    prisonCode: string,
    usageType: string,
    user: ServiceUser,
  ): Promise<Location[]> {
    return this.get(
      {
        path: `/locations/prison/${prisonCode}/non-residential-usage-type/${usageType}?formatLocalName=true&filterParents=false`,
      },
      asSystem(user.username),
    )
  }
}
