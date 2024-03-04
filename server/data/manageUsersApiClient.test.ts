import nock from 'nock'

import config from '../config'
import ManageUsersApiClient from './manageUsersApiClient'
import TokenStore from './tokenStore'

const user = { token: 'token-1', username: 'jbloggs' } as Express.User

describe('manageUsersApiClient', () => {
  let fakeManageUsersApi: nock.Scope
  let manageUsersApiClient: ManageUsersApiClient

  beforeEach(() => {
    fakeManageUsersApi = nock(config.apis.manageUsersApi.url)
    manageUsersApiClient = new ManageUsersApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getUser', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeManageUsersApi.get('/users/jbloggs').matchHeader('authorization', `Bearer accessToken`).reply(200, response)

      const output = await manageUsersApiClient.getUser(user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
