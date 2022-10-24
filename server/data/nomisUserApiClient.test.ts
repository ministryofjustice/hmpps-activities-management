import nock from 'nock'

import config from '../config'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import NomisUserApiClient from './nomisUserApiClient'

const user = { token: 'token', username: 'jbloggs' } as ServiceUser

jest.mock('./tokenStore')

describe('nomisUserApiClient', () => {
  let fakeNomisUserApi: nock.Scope
  let nomisUserApiClient: NomisUserApiClient

  beforeEach(() => {
    fakeNomisUserApi = nock(config.apis.nomisUserApi.url)
    nomisUserApiClient = new NomisUserApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getUserRoles', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeNomisUserApi
        .get('/users/jbloggs/roles?include-nomis-roles=true')
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await nomisUserApiClient.getUserRoles(user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
