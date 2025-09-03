import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import PrisonRegisterApiClient from './prisonRegisterApiClient'

jest.mock('./tokenStore')

describe('prisonRegisterApiClient', () => {
  let fakePrisonRegisterApi: nock.Scope
  let prisonRegisterApiClient: PrisonRegisterApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('accessToken'),
    } as unknown as jest.Mocked<AuthenticationClient>
    fakePrisonRegisterApi = nock(config.apis.prisonRegisterApi.url)
    prisonRegisterApiClient = new PrisonRegisterApiClient(mockAuthenticationClient)
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

      const output = await prisonRegisterApiClient.getPrisonInformation('BMI')

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
