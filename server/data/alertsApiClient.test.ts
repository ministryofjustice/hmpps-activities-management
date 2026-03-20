import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import AlertsApiClient from './alertsApiClient'

jest.mock('./tokenStore')

describe('alertsApiClient', () => {
  let fakeAlertsApi: nock.Scope
  let alertsApiClient: AlertsApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    fakeAlertsApi = nock(config.apis.alertsApi.url)
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    alertsApiClient = new AlertsApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getAlertsForPrisoners', () => {
    it('returns data from api', async () => {
      const response = { data: 'some data' }

      fakeAlertsApi
        .post('/search/alerts/prison-numbers')
        .query({ includeInactive: false })
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await alertsApiClient.getAlertsForPrisoners(['G4793VF', 'G0113GG'])

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
