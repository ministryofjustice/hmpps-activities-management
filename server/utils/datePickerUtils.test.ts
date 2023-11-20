import { addDays, isValid, parse, subDays } from 'date-fns'
import {
  dateFromDateOption,
  datePickerDateToIsoDate,
  formatDatePickerDate,
  formatIsoDate,
  isoDateToDatePickerDate,
  isValidIsoDate,
  parseDatePickerDate,
  parseIsoDate,
} from './datePickerUtils'
import DateOption from '../enum/dateOption'

describe('Date Picker Utils', () => {
  describe('parseDatePickerDate', () => {
    it('returns invalid date for non date string', () => {
      const date = parseDatePickerDate('Not a date')

      expect(isValid(date)).toBe(false)
    })

    it.each([
      { datePickerDate: '23-10-2023', separator: '-' },
      { datePickerDate: '23/10/2023', separator: '/' },
      { datePickerDate: '23,10,2023', separator: ',' },
      { datePickerDate: '23.10.2023', separator: '.' },
      { datePickerDate: '23 10 2023', separator: ' ' },
    ])("parses date string when separator is '$separator'", async ({ datePickerDate }) => {
      const date = parseDatePickerDate(datePickerDate)

      expect(date).toEqual(parse('2023-10-23', 'yyyy-MM-dd', new Date()))
    })

    it('parses one digit day and month and two digit year', () => {
      const date = parseDatePickerDate('2/9/23')

      expect(date).toEqual(parse('2023-09-02', 'yyyy-MM-dd', new Date()))
    })

    it('parses three digit year', () => {
      const date = parseDatePickerDate('02/09/223')

      expect(date).toEqual(parse('0223-09-02', 'yyyy-MM-dd', new Date()))
    })
  })

  describe('parseIsoDate', () => {
    it('returns invalid date for non date string', () => {
      const date = parseIsoDate('Not a date')

      expect(isValid(date)).toBe(false)
    })

    it('parses iso date string', () => {
      const date = parseIsoDate('2023-09-29')

      expect(date).toEqual(parse('2023-09-29', 'yyyy-MM-dd', new Date()))
    })
  })

  describe('isValidIsoDate', () => {
    it('returns false for falsy date string', () => {
      expect(isValidIsoDate(undefined)).toBe(false)
      expect(isValidIsoDate(null)).toBe(false)
      expect(isValidIsoDate('')).toBe(false)
    })

    it('returns false for non date string', () => {
      expect(isValidIsoDate('Not a date')).toBe(false)
    })

    it('returns true for iso date string', () => {
      expect(isValidIsoDate('2023-09-29')).toBe(true)
    })

    it('returns false for date picker date string', () => {
      expect(isValidIsoDate('23/10/2023')).toBe(false)
    })
  })

  describe('formatDatePickerDate', () => {
    it('formats date as date picker date string', () => {
      expect(formatDatePickerDate(parse('2023-09-29', 'yyyy-MM-dd', new Date()))).toEqual('29/09/2023')
    })
  })

  describe('formatIsoDate', () => {
    it('formats date as iso date string', () => {
      expect(formatIsoDate(parse('2023-09-29', 'yyyy-MM-dd', new Date()))).toEqual('2023-09-29')
    })
  })

  describe('datePickerDateToIsoDate', () => {
    it('returns undefined for non date string', () => {
      expect(datePickerDateToIsoDate('Not a date')).toBeNull()
    })

    it('converts date picker date to iso date string', () => {
      expect(datePickerDateToIsoDate('2/3/23')).toEqual('2023-03-02')
    })
  })

  describe('isoDateToDatePickerDate', () => {
    it('returns undefined for non date string', () => {
      expect(isoDateToDatePickerDate('Not a date')).toBeNull()
    })

    it('converts iso date string to date picker date', () => {
      expect(isoDateToDatePickerDate('2023-03-02')).toEqual('02/03/2023')
    })
  })

  describe('dateFromDateOption', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    it("uses yesterday's date when date option is yesterday", () => {
      expect(dateFromDateOption(DateOption.YESTERDAY)).toEqual(subDays(today, 1))
    })

    it("uses today's date when date option is today", () => {
      expect(dateFromDateOption(DateOption.TODAY)).toEqual(today)
    })

    it("uses tomorrow's date when date option is tomorrow", () => {
      expect(dateFromDateOption(DateOption.TOMORROW)).toEqual(addDays(today, 1))
    })

    it('uses other date when date option is other', () => {
      expect(dateFromDateOption(DateOption.OTHER, '2023-10-16')).toEqual(parseIsoDate('2023-10-16'))
    })
  })
})
