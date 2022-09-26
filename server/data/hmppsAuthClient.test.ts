import nock from 'nock'

import config from '../config'
import HmppsAuthClient from './hmppsAuthClient'
import { ServiceUser } from '../@types/express'

const user = { token: 'token-1' } as ServiceUser

describe('hmppsAuthClient', () => {
  let fakeHmppsAuthApi: nock.Scope
  let hmppsAuthClient: HmppsAuthClient

  beforeEach(() => {
    fakeHmppsAuthApi = nock(config.apis.hmppsAuth.url)
    hmppsAuthClient = new HmppsAuthClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getUser', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeHmppsAuthApi.get('/api/user/me').matchHeader('authorization', `Bearer ${user.token}`).reply(200, response)

      const output = await hmppsAuthClient.getUser(user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getUserRoles', () => {
    it('should return data from api', async () => {
      fakeHmppsAuthApi
        .get('/api/user/me/roles')
        .matchHeader('authorization', `Bearer ${user.token}`)
        .reply(200, [{ roleCode: 'role1' }, { roleCode: 'role2' }])

      const output = await hmppsAuthClient.getUserRoles(user)

      expect(output).toEqual(['role1', 'role2'])
      expect(nock.isDone()).toBe(true)
    })
  })
})
