import { when } from 'jest-when'
import { ServiceUser } from '../@types/express'
import BankHolidaysClient from '../data/bankHolidaysClient'
import BankHolidayService from './bankHolidayService'
import TokenStoreInterface from '../data/tokenStoreInterface'

jest.mock('../data/bankHolidaysClient')
let tokenStore: TokenStoreInterface

const mockBankHolidaysList = {
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
  scotland: {
    division: 'scotland',
    events: [
      {
        title: 'Early May bank holiday',
        date: '2019-05-06',
        notes: '',
        bunting: true,
      },
      {
        title: 'Spring bank holiday',
        date: '2019-05-27',
        notes: '',
        bunting: true,
      },
      {
        title: 'Summer bank holiday',
        date: '2019-08-26',
        notes: '',
        bunting: true,
      },
    ],
  },
  'northern-ireland': {
    division: 'northern-ireland',
    events: [
      {
        title: 'Christmas Day',
        date: '2019-12-25',
        notes: '',
        bunting: true,
      },
      {
        title: 'Boxing Day',
        date: '2019-12-26',
        notes: '',
        bunting: true,
      },
      {
        title: 'New Year’s Day',
        date: '2020-01-01',
        notes: '',
        bunting: true,
      },
    ],
  },
}

describe('Bank Holiday service', () => {
  let bankHolidaysClient: jest.Mocked<BankHolidaysClient>
  let bankHolidaysService: BankHolidayService

  const user = { activeCaseLoadId: 'MDI', username: 'USER1', displayName: 'John Smith' } as ServiceUser

  beforeEach(() => {
    tokenStore = {
      getToken: async () => null,
      setToken: jest.fn(),
      delToken: jest.fn(),
      delTokenSync: jest.fn(),
      setTokenSync: jest.fn(),
    }
    bankHolidaysClient = new BankHolidaysClient() as jest.Mocked<BankHolidaysClient>
    bankHolidaysService = new BankHolidayService(bankHolidaysClient, tokenStore)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getUkBankHolidays', () => {
    it('should get a list of bank holidays for england-and-wales', async () => {
      tokenStore.getToken = jest.fn().mockResolvedValue(null)
      const expectedResult = [new Date('2019-01-01'), new Date('2019-04-19'), new Date('2019-04-22')]

      when(bankHolidaysClient.getBankHolidays).mockResolvedValue(mockBankHolidaysList)

      const actualResult = await bankHolidaysService.getUkBankHolidays('england-and-wales', user)

      expect(actualResult).toEqual(expectedResult)
      expect(bankHolidaysClient.getBankHolidays).toHaveBeenCalledWith(user)
      expect(tokenStore.setToken).toHaveBeenCalledWith(
        'england-and-wales.bankHolidays',
        JSON.stringify({ events: expectedResult.map(date => ({ date })) }),
        60 * 60 * 24 * 7,
      )
    })

    it('should get a list of bank holidays for scotland', async () => {
      tokenStore.getToken = jest.fn().mockResolvedValue(null)
      const expectedResult = [new Date('2019-05-06'), new Date('2019-05-27'), new Date('2019-08-26')]

      when(bankHolidaysClient.getBankHolidays).mockResolvedValue(mockBankHolidaysList)

      const actualResult = await bankHolidaysService.getUkBankHolidays('scotland', user)

      expect(actualResult).toEqual(expectedResult)
      expect(bankHolidaysClient.getBankHolidays).toHaveBeenCalledWith(user)
      expect(tokenStore.setToken).toHaveBeenCalledWith(
        'scotland.bankHolidays',
        JSON.stringify({ events: expectedResult.map(date => ({ date })) }),
        60 * 60 * 24 * 7,
      )
    })

    it('should get a list of bank holidays for northern-ireland', async () => {
      tokenStore.getToken = jest.fn().mockResolvedValue(null)
      const expectedResult = [new Date('2019-12-25'), new Date('2019-12-26'), new Date('2020-01-01')]

      when(bankHolidaysClient.getBankHolidays).mockResolvedValue(mockBankHolidaysList)

      const actualResult = await bankHolidaysService.getUkBankHolidays('northern-ireland', user)

      expect(actualResult).toEqual(expectedResult)
      expect(bankHolidaysClient.getBankHolidays).toHaveBeenCalledWith(user)
      expect(tokenStore.setToken).toHaveBeenCalledWith(
        'northern-ireland.bankHolidays',
        JSON.stringify({ events: expectedResult.map(date => ({ date })) }),
        60 * 60 * 24 * 7,
      )
    })

    it('should get cached bank holidays', async () => {
      const expectedResult = [new Date('2019-01-01'), new Date('2019-04-19'), new Date('2019-04-22')]
      tokenStore.getToken = jest.fn().mockResolvedValue(JSON.stringify(mockBankHolidaysList['england-and-wales']))

      const actualResult = await bankHolidaysService.getUkBankHolidays('england-and-wales', user)

      expect(actualResult).toEqual(expectedResult)
      expect(bankHolidaysClient.getBankHolidays).not.toHaveBeenCalled()
      expect(tokenStore.setToken).not.toHaveBeenCalled()
    })
  })
})
