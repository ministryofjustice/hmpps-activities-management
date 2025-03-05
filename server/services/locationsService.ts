import { ServiceUser } from '../@types/express'
import LocationsInsidePrisonApiClient from '../data/locationsInsidePrisonApiClient'
import { Location } from '../@types/locationsInsidePrisonApi/types'

export default class LocationsService {
  constructor(private readonly locationInsidePrisonApiClient: LocationsInsidePrisonApiClient) {}

  public async fetchActivityLocations(prisonCode: string, user: ServiceUser): Promise<LocationWithDescription[]> {
    return this.locationInsidePrisonApiClient
      .fetchLocationsByNonResidentialUsageType(prisonCode, 'PROGRAMMES_ACTIVITIES', user)
      .then(locations => {
        return locations
          .map(location => {
            return { ...location, description: location.localName || location.code }
          })
          .sort((a, b) => a.description.localeCompare(b.description))
      })
  }
}

export type LocationWithDescription = Location & { description: string }
