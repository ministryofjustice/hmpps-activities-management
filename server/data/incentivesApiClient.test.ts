import nock from 'nock'

import config from '../config'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import IncentivesApiClient from './incentivesApiClient'

const user = {} as ServiceUser

jest.mock('./tokenStore')

describe('incentivesApiClient', () => {
  let fakeIncentivesApi: nock.Scope
  let incentivesApiClient: IncentivesApiClient

  beforeEach(() => {
    fakeIncentivesApi = nock(config.apis.incentivesApi.url)
    incentivesApiClient = new IncentivesApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getIncentiveLevels', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeIncentivesApi.get('/iep/levels/MDI').matchHeader('authorization', `Bearer accessToken`).reply(200, response)

      const output = await incentivesApiClient.getIncentiveLevels('MDI', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
