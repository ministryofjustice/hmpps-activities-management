import { when } from 'jest-when'
import { ServiceUser } from '../@types/express'
import LocationMappingService from './locationMappingService'
import LocationsInsidePrisonApiClient from '../data/locationsInsidePrisonApiClient'
import NomisMappingClient from '../data/nomisMappingClient'
import { Location } from '../@types/locationsInsidePrisonApi/types'
import atLeast from '../../jest.setup'

jest.mock('../data/locationsInsidePrisonApiClient')
jest.mock('../data/nomisMappingClient')

describe('Location Mapping Service', () => {
  let locationInsidePrisonApiClient: jest.Mocked<LocationsInsidePrisonApiClient>
  let nomisMappingClient: jest.Mocked<NomisMappingClient>
  let locationMappingService: LocationMappingService

  const user = { activeCaseLoadId: 'MDI', username: 'USER1', displayName: 'John Smith' } as ServiceUser

  beforeEach(() => {
    locationInsidePrisonApiClient = new LocationsInsidePrisonApiClient() as jest.Mocked<LocationsInsidePrisonApiClient>
    nomisMappingClient = new NomisMappingClient() as jest.Mocked<NomisMappingClient>
    locationMappingService = new LocationMappingService(locationInsidePrisonApiClient, nomisMappingClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('map DPS location key to nomis ID', () => {
    it('should return a nomis location ID given a DPS location key', async () => {
      when(locationInsidePrisonApiClient.fetchLocationByKey)
        .calledWith(atLeast('LOCATION_KEY'))
        .mockResolvedValue({ id: 'abc-123' } as Location)

      when(nomisMappingClient.getNomisLocationMappingByDpsLocationId)
        .calledWith(atLeast('abc-123'))
        .mockResolvedValue({ dpsLocationId: 'abc-123', nomisLocationId: 1001 })

      expect(await locationMappingService.mapDpsLocationKeyToNomisId('LOCATION_KEY', user)).toEqual(1001)
    })
  })

  describe('map nomis location ID to DPS location key', () => {
    it('should return a dps location key given a nomis location id', async () => {
      when(nomisMappingClient.getNomisLocationMappingByNomisLocationId)
        .calledWith(atLeast(1001))
        .mockResolvedValue({ dpsLocationId: 'abc-123', nomisLocationId: 1001 })

      when(locationInsidePrisonApiClient.fetchLocationById)
        .calledWith(atLeast('abc-123'))
        .mockResolvedValue({ key: 'LOCATION_KEY' } as Location)

      expect(await locationMappingService.mapNomisLocationIdToDpsKey(1001, user)).toEqual('LOCATION_KEY')
    })
  })
})
