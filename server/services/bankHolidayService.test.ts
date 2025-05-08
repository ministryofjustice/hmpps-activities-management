import { when } from 'jest-when'
import { ServiceUser } from '../@types/express'
import BankHolidaysClient from '../data/bankHolidaysClient'
import BankHolidayService from './bankHolidayService'

jest.mock('../data/bankHolidaysClient')

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
    bankHolidaysClient = new BankHolidaysClient() as jest.Mocked<BankHolidaysClient>
    bankHolidaysService = new BankHolidayService(bankHolidaysClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getUkBankHolidays', () => {
    it('should get a list of bank holidays for england-and-wales', async () => {
      const expectedResult = [new Date('2019-01-01'), new Date('2019-04-19'), new Date('2019-04-22')]

      when(bankHolidaysClient.getBankHolidays).mockResolvedValue(mockBankHolidaysList)

      const actualResult = await bankHolidaysService.getUkBankHolidays('england-and-wales', user)

      expect(actualResult).toEqual(expectedResult)
      expect(bankHolidaysClient.getBankHolidays).toHaveBeenCalledWith(user)
    })

    it('should get a list of bank holidays for scotland', async () => {
      const expectedResult = [new Date('2019-05-06'), new Date('2019-05-27'), new Date('2019-08-26')]

      when(bankHolidaysClient.getBankHolidays).mockResolvedValue(mockBankHolidaysList)

      const actualResult = await bankHolidaysService.getUkBankHolidays('scotland', user)

      expect(actualResult).toEqual(expectedResult)
      expect(bankHolidaysClient.getBankHolidays).toHaveBeenCalledWith(user)
    })

    it('should get a list of bank holidays for northern-ireland', async () => {
      const expectedResult = [new Date('2019-12-25'), new Date('2019-12-26'), new Date('2020-01-01')]

      when(bankHolidaysClient.getBankHolidays).mockResolvedValue(mockBankHolidaysList)

      const actualResult = await bankHolidaysService.getUkBankHolidays('northern-ireland', user)

      expect(actualResult).toEqual(expectedResult)
      expect(bankHolidaysClient.getBankHolidays).toHaveBeenCalledWith(user)
    })
  })
})
