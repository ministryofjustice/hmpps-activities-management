import nock from 'nock'

import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import { ServiceUser } from '../@types/express'
import IncentivesApiClient from './incentivesApiClient'

const user = { username: 'jbloggs' } as ServiceUser

describe('incentivesApiClient', () => {
  let fakeIncentivesApi: nock.Scope
  let incentivesApiClient: IncentivesApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    fakeIncentivesApi = nock(config.apis.incentivesApi.url)
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    incentivesApiClient = new IncentivesApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getIncentiveLevels', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeIncentivesApi
        .get('/incentive/prison-levels/MDI')
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await incentivesApiClient.getIncentiveLevels('MDI', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
