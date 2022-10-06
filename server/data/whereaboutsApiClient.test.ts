import nock from 'nock'

import config from '../config'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import WhereaboutsApiClient from './whereaboutsApiClient'

const user = { token: 'token' } as ServiceUser

jest.mock('./tokenStore')

describe('whereaboutsApiClient', () => {
  let fakeWhereaboutsApi: nock.Scope
  let whereaboutsApiClient: WhereaboutsApiClient

  beforeEach(() => {
    fakeWhereaboutsApi = nock(config.apis.whereaboutsApi.url)
    whereaboutsApiClient = new WhereaboutsApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getAttendance', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeWhereaboutsApi
        .get(`/attendances/MDI/10001`)
        .query({ date: '2022-08-01', period: 'AM' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await whereaboutsApiClient.getAttendance('MDI', '10001', '2022-08-01', 'AM', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
