import nock from 'nock'
import config from '../config'
import BankHolidaysClient from './bankHolidaysClient'
import { ServiceUser } from '../@types/express'
import TokenStore from './tokenStore'

const user = {} as ServiceUser

jest.mock('./tokenStore')

describe('BankHolidaysClient', () => {
  let fakeGovUkBankHolidaysApi: nock.Scope
  let bankHolidaysClient: BankHolidaysClient

  beforeEach(() => {
    fakeGovUkBankHolidaysApi = nock(config.apis.bankHolidaysApi.url)
    bankHolidaysClient = new BankHolidaysClient()
    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('get bank holidays', () => {
    it('should return data from api', async () => {
      const response = {
        'england-and-wales': {
          division: 'england-and-wales',
          events: [
            {
              title: "New Year's Day",
              date: '2019-01-01',
              notes: '',
              bunting: true,
            },
            {
              title: 'Good Friday',
              date: '2019-04-19',
              notes: '',
              bunting: false,
            },
            {
              title: 'Easter Monday',
              date: '2019-04-22',
              notes: '',
              bunting: true,
            },
          ],
        },
      }

      fakeGovUkBankHolidaysApi.get('').matchHeader('authorization', `Bearer accessToken`).reply(200, response)

      const output = await bankHolidaysClient.getBankHolidays(user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
