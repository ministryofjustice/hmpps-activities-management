import { when } from 'jest-when'
import { ServiceUser } from '../@types/express'
import BankHolidaysClient from '../data/bankHolidaysClient'
import BankHolidayService from './bankHolidayService'

jest.mock('../data/bankHolidaysClient')

describe('Bank Holiday service', () => {
  let bankHolidaysClient: jest.Mocked<BankHolidaysClient>
  let bankHolidaysService: BankHolidayService

  const user = { activeCaseLoadId: 'MDI', username: 'USER1', displayName: 'John Smith' } as ServiceUser

  beforeEach(() => {
    bankHolidaysClient = new BankHolidaysClient() as jest.Mocked<BankHolidaysClient>
    bankHolidaysService = new BankHolidayService(bankHolidaysClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getUkBankHolidays', () => {
    it('should get a list of bank holidays', async () => {
      const expectedResult = [new Date('2019-01-01'), new Date('2019-04-19'), new Date('2019-04-22')]

      when(bankHolidaysClient.getBankHolidays).mockResolvedValue({
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
        scotland: undefined,
        'northern-ireland': undefined,
      })

      const actualResult = await bankHolidaysService.getUkBankHolidays('england-and-wales', user)

      expect(actualResult).toEqual(expectedResult)
      expect(bankHolidaysClient.getBankHolidays).toHaveBeenCalledWith(user)
    })
  })
})
