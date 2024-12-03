import nock from 'nock'

import config from '../config'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import LocationsInsidePrisonApiClient from './locationsInsidePrisonApiClient'

const user = {} as ServiceUser

jest.mock('./tokenStore')

describe('locationsInsidePrisonApiClient', () => {
  let fakeLocationsInsidePrisonApi: nock.Scope
  let locationsInsidePrisonApiClient: LocationsInsidePrisonApiClient

  beforeEach(() => {
    fakeLocationsInsidePrisonApi = nock(config.apis.locationsInsidePrisonApi.url)
    locationsInsidePrisonApiClient = new LocationsInsidePrisonApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
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
        .matchHeader('authorization', `Bearer accessToken`)
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
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await locationsInsidePrisonApiClient.fetchLocationByKey('LOCATION_KEY', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
