import { ServiceUser } from '../@types/express'
import NomisMappingClient from '../data/nomisMappingClient'
import LocationsInsidePrisonApiClient from '../data/locationsInsidePrisonApiClient'

export default class LocationMappingService {
  constructor(
    private readonly locationInsidePrisonApiClient: LocationsInsidePrisonApiClient,
    private readonly nomisMappingClient: NomisMappingClient,
  ) {}

  public async mapDpsLocationKeyToNomisId(dpsLocationKey: string, user: ServiceUser): Promise<number> {
    return this.locationInsidePrisonApiClient
      .fetchLocationByKey(dpsLocationKey, user)
      .then(location => this.nomisMappingClient.getNomisLocationMappingByDpsLocationId(location.id, user))
      .then(mapping => mapping.nomisLocationId)
  }

  public async mapNomisLocationIdToDpsKey(nomisLocationId: number, user: ServiceUser): Promise<string> {
    return this.nomisMappingClient
      .getNomisLocationMappingByNomisLocationId(nomisLocationId, user)
      .then(mapping => this.locationInsidePrisonApiClient.fetchLocationById(mapping.dpsLocationId, user))
      .then(location => location.key)
  }
}
