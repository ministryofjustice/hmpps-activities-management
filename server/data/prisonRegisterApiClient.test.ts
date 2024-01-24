import nock from 'nock'

import config from '../config'
import TokenStore from './tokenStore'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import { ServiceUser } from '../@types/express'

const user = {} as ServiceUser

jest.mock('./tokenStore')

describe('prisonRegisterApiClient', () => {
  let fakePrisonRegisterApi: nock.Scope
  let prisonRegisterApiClient: PrisonRegisterApiClient

  beforeEach(() => {
    fakePrisonRegisterApi = nock(config.apis.prisonRegisterApi.url)
    prisonRegisterApiClient = new PrisonRegisterApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getPrisonInformation', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonRegisterApi
        .get('/prisons/id/BMI')
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await prisonRegisterApiClient.getPrisonInformation('BMI', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
