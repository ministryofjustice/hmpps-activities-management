import nock from 'nock'

import config from '../config'
import PrisonApiClient from './prisonApiClient'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'

const user = {} as ServiceUser

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

  describe('getInmateDetail', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi.get('/api/offenders/ABC123').matchHeader('authorization', `Bearer accessToken`).reply(200, response)

      const output = await prisonApiClient.getInmateDetail('ABC123', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
