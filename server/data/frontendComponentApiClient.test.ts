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
      const response = { header: 'testHeader', footer: 'testFooter' }

      fakeFrontendComponentApi
        .get('/components?component=header&component=footer')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('x-user-token', `token`)
        .reply(200, response)

      const { header, footer } = await frontendComponentApiClient.getComponents(['header', 'footer'], user)

      expect(header).toEqual('testHeader')
      expect(footer).toEqual('testFooter')
      expect(nock.isDone()).toBe(true)
    })
  })
})
