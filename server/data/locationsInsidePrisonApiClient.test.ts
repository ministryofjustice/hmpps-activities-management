import nock from 'nock'

import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import { ServiceUser } from '../@types/express'
import LocationsInsidePrisonApiClient from './locationsInsidePrisonApiClient'

const user = { username: 'jbloggs' } as ServiceUser

describe('locationsInsidePrisonApiClient', () => {
  let fakeLocationsInsidePrisonApi: nock.Scope
  let locationsInsidePrisonApiClient: LocationsInsidePrisonApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    fakeLocationsInsidePrisonApi = nock(config.apis.locationsInsidePrisonApi.url)
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    locationsInsidePrisonApiClient = new LocationsInsidePrisonApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('get location by id', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeLocationsInsidePrisonApi
        .get('/locations/abc-123')
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await locationsInsidePrisonApiClient.fetchLocationById('abc-123', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('get location by key', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeLocationsInsidePrisonApi
        .get('/locations/key/LOCATION_KEY')
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await locationsInsidePrisonApiClient.fetchLocationByKey('LOCATION_KEY', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('get location by non-residential usage type', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeLocationsInsidePrisonApi
        .get(
          '/locations/prison/RSI/non-residential-usage-type/PROGRAMMES_ACTIVITIES?formatLocalName=true&filterParents=false',
        )
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await locationsInsidePrisonApiClient.fetchLocationsByNonResidentialUsageType(
        'RSI',
        'PROGRAMMES_ACTIVITIES',
        user,
      )

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
