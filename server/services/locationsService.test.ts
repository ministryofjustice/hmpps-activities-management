import { when } from 'jest-when'
import { ServiceUser } from '../@types/express'
import LocationsInsidePrisonApiClient from '../data/locationsInsidePrisonApiClient'
import { Location } from '../@types/locationsInsidePrisonApi/types'
import atLeast from '../../jest.setup'
import LocationsService, { LocationWithDescription } from './locationsService'

jest.mock('../data/locationsInsidePrisonApiClient')

describe('Locations Service', () => {
  let locationInsidePrisonApiClient: jest.Mocked<LocationsInsidePrisonApiClient>
  let locationsService: LocationsService

  const user = { activeCaseLoadId: 'MDI', username: 'USER1', displayName: 'John Smith' } as ServiceUser

  beforeEach(() => {
    locationInsidePrisonApiClient = new LocationsInsidePrisonApiClient() as jest.Mocked<LocationsInsidePrisonApiClient>
    locationsService = new LocationsService(locationInsidePrisonApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('return fetchLocationsByNonResidentialUsageType', () => {
    it('should return locations', async () => {
      const locations = [
        { id: '123', code: 'AWING', localName: 'A Wing' },
        { id: '456', code: 'BWING', localName: 'B Wing' },
      ] as Location[]

      when(locationInsidePrisonApiClient.fetchLocationsByNonResidentialUsageType)
        .calledWith(atLeast('RSI', 'PROGRAMMES_ACTIVITIES'))
        .mockResolvedValue(locations)

      const expectedLocations = [
        { id: '123', code: 'AWING', localName: 'A Wing', description: 'A Wing' },
        { id: '456', code: 'BWING', localName: 'B Wing', description: 'B Wing' },
      ] as LocationWithDescription[]

      expect(await locationsService.fetchActivityLocations('RSI', user)).toEqual(expectedLocations)
    })

    it('should return locations including those without a local name', async () => {
      const locations = [
        { id: '123', code: 'AWING', localName: 'A Wing' },
        { id: '456', code: 'BWING' },
      ] as Location[]

      when(locationInsidePrisonApiClient.fetchLocationsByNonResidentialUsageType)
        .calledWith(atLeast('RSI', 'PROGRAMMES_ACTIVITIES'))
        .mockResolvedValue(locations)

      const expectedLocations = [
        { id: '123', code: 'AWING', localName: 'A Wing', description: 'A Wing' },
        { id: '456', code: 'BWING', description: 'BWING' },
      ] as LocationWithDescription[]

      expect(await locationsService.fetchActivityLocations('RSI', user)).toEqual(expectedLocations)
    })

    it('should sort locations', async () => {
      const locations = [
        { id: '789', code: 'CWING', localName: 'C Wing' },
        { id: '123', code: 'AWING', localName: 'A Wing' },
        { id: '456', code: 'BWING' },
      ] as Location[]

      when(locationInsidePrisonApiClient.fetchLocationsByNonResidentialUsageType)
        .calledWith(atLeast('RSI', 'PROGRAMMES_ACTIVITIES'))
        .mockResolvedValue(locations)

      const expectedLocations = [
        { id: '123', code: 'AWING', localName: 'A Wing', description: 'A Wing' },
        { id: '456', code: 'BWING', description: 'BWING' },
        { id: '789', code: 'CWING', localName: 'C Wing', description: 'C Wing' },
      ] as LocationWithDescription[]

      expect(await locationsService.fetchActivityLocations('RSI', user)).toEqual(expectedLocations)
    })
  })

  describe('return fetchNonResidentialLocationsByUsageType', () => {
    it('should return locations', async () => {
      const locations = [
        { id: '123', code: 'AWING', localName: 'A Wing' },
        { id: '456', code: 'BWING', localName: 'B Wing' },
      ] as Location[]

      when(locationInsidePrisonApiClient.fetchNonResidentialLocationsByUsageType)
        .calledWith(atLeast('RSI'))
        .mockResolvedValue(locations)

      const expectedLocations = [
        { id: '123', code: 'AWING', localName: 'A Wing', description: 'A Wing' },
        { id: '456', code: 'BWING', localName: 'B Wing', description: 'B Wing' },
      ] as LocationWithDescription[]

      expect(await locationsService.fetchNonResidentialActivityLocations('RSI', user)).toEqual(expectedLocations)
    })

    it('should return locations including those without a local name', async () => {
      const locations = [
        { id: '123', code: 'AWING', localName: 'A Wing' },
        { id: '456', code: 'BWING' },
      ] as Location[]

      when(locationInsidePrisonApiClient.fetchNonResidentialLocationsByUsageType)
        .calledWith(atLeast('RSI'))
        .mockResolvedValue(locations)

      const expectedLocations = [
        { id: '123', code: 'AWING', localName: 'A Wing', description: 'A Wing' },
        { id: '456', code: 'BWING', description: 'BWING' },
      ] as LocationWithDescription[]

      expect(await locationsService.fetchNonResidentialActivityLocations('RSI', user)).toEqual(expectedLocations)
    })

    it('should sort locations', async () => {
      const locations = [
        { id: '789', code: 'CWING', localName: 'C Wing' },
        { id: '123', code: 'AWING', localName: 'A Wing' },
        { id: '456', code: 'BWING' },
      ] as Location[]

      when(locationInsidePrisonApiClient.fetchNonResidentialLocationsByUsageType)
        .calledWith(atLeast('RSI'))
        .mockResolvedValue(locations)

      const expectedLocations = [
        { id: '123', code: 'AWING', localName: 'A Wing', description: 'A Wing' },
        { id: '456', code: 'BWING', description: 'BWING' },
        { id: '789', code: 'CWING', localName: 'C Wing', description: 'C Wing' },
      ] as LocationWithDescription[]

      expect(await locationsService.fetchNonResidentialActivityLocations('RSI', user)).toEqual(expectedLocations)
    })
  })
})
