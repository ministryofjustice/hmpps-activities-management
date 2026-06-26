import nock from 'nock'

import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import { ServiceUser } from '../@types/express'
import NomisMappingClient from './nomisMappingClient'

const user = { username: 'jbloggs' } as ServiceUser

describe('nomisMappingClient', () => {
  let fakeNomisMappingApi: nock.Scope
  let nomisMappingClient: NomisMappingClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    fakeNomisMappingApi = nock(config.apis.nomisMapping.url)
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    nomisMappingClient = new NomisMappingClient(mockAuthenticationClient)
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
        .matchHeader('authorization', `Bearer test-system-token`)
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
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await nomisMappingClient.getNomisLocationMappingByNomisLocationId(1, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
