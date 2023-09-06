import nock from 'nock'

import config from '../config'
import { ServiceUser } from '../@types/express'
import FrontendComponentApiClient from './frontendComponentApiClient'

const user = { token: 'token' } as ServiceUser

describe('frontendComponentApiClient', () => {
  let fakeFrontendComponentApi: nock.Scope
  let frontendComponentApiClient: FrontendComponentApiClient

  beforeEach(() => {
    fakeFrontendComponentApi = nock(config.apis.frontendComponents.url)
    frontendComponentApiClient = new FrontendComponentApiClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getComponent', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeFrontendComponentApi
        .get('/header')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('x-user-token', `token`)
        .reply(200, response)

      const output = await frontendComponentApiClient.getComponent('header', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
