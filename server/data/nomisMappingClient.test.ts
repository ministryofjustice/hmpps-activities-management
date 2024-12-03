import nock from 'nock'

import config from '../config'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import NomisMappingClient from './nomisMappingClient'

const user = {} as ServiceUser

jest.mock('./tokenStore')

describe('nomisMappingClient', () => {
  let fakeNomisMappingApi: nock.Scope
  let nomisMappingClient: NomisMappingClient

  beforeEach(() => {
    fakeNomisMappingApi = nock(config.apis.nomisMapping.url)
    nomisMappingClient = new NomisMappingClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('get mapping by dps location id', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeNomisMappingApi
        .get('/api/locations/dps/abc-123')
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await nomisMappingClient.getNomisLocationMappingByDpsLocationId('abc-123', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('get mapping by nomis location id', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeNomisMappingApi
        .get('/api/locations/nomis/1')
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await nomisMappingClient.getNomisLocationMappingByNomisLocationId(1, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
