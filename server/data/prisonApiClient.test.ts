import nock from 'nock'

import config from '../config'
import PrisonApiClient from './prisonApiClient'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'

const user = { token: 'token' } as ServiceUser

jest.mock('./tokenStore')

describe('prisonApiClient', () => {
  let fakePrisonApi: nock.Scope
  let prisonApiClient: PrisonApiClient

  beforeEach(() => {
    fakePrisonApi = nock(config.apis.prisonApi.url)
    prisonApiClient = new PrisonApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getEventLocations', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .get('/api/agencies/MDI/eventLocations')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getEventLocations('MDI', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getPayProfile', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi.get('/api/agencies/MDI/pay-profile').reply(200, response)

      const output = await prisonApiClient.getPayProfile('MDI')
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getInternalLocationByKey', () => {
    it('should return data from api', async () => {
      const response = { data: 'locationData' }

      fakePrisonApi.get('/api/locations/code/KEY123').matchHeader('authorization', `Bearer token`).reply(200, response)

      const output = await prisonApiClient.getInternalLocationByKey('KEY123', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
