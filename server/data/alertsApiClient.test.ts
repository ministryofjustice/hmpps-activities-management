import nock from 'nock'
import config from '../config'
import TokenStore from './tokenStore'
import AlertsApiClient from './alertsApiClient'
import { ServiceUser } from '../@types/express'

const user = {} as ServiceUser

jest.mock('./tokenStore')

describe('alertsApiClient', () => {
  let fakeAlertsApi: nock.Scope
  let alertsApiClient: AlertsApiClient

  beforeEach(() => {
    fakeAlertsApi = nock(config.apis.alertsApi.url)
    alertsApiClient = new AlertsApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
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
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await alertsApiClient.getAlertsForPrisoners(['G4793VF', 'G0113GG'], user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
