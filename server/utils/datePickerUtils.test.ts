import { isValid, parse } from 'date-fns'
import {
  datePickerDateToIsoDate,
  formatDatePickerDate,
  formatIsoDate,
  isoDateToDatePickerDate,
  isValidDatePickerDate,
  isValidIsoDate,
  parseDatePickerDate,
  parseIsoDate,
} from './datePickerUtils'

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

  describe('isValidDatePickerDate', () => {
    it('returns false for falsy date string', () => {
      expect(isValidDatePickerDate(undefined)).toBe(false)
      expect(isValidDatePickerDate(null)).toBe(false)
      expect(isValidDatePickerDate('')).toBe(false)
    })

    it('returns false for non date string', () => {
      expect(isValidDatePickerDate('Not a date')).toBe(false)
    })

    it('returns false for iso date string', () => {
      expect(isValidDatePickerDate('2023-09-29')).toBe(false)
    })

    it('returns true for date picker date string', () => {
      expect(isValidDatePickerDate('23/10/2023')).toBe(true)
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
      expect(datePickerDateToIsoDate('Not a date')).toBeUndefined()
    })

    it('converts date picker date to iso date string', () => {
      expect(datePickerDateToIsoDate('2/3/23')).toEqual('2023-03-02')
    })
  })

  describe('isoDateToDatePickerDate', () => {
    it('returns undefined for non date string', () => {
      expect(isoDateToDatePickerDate('Not a date')).toBeUndefined()
    })

    it('converts iso date string to date picker date', () => {
      expect(isoDateToDatePickerDate('2023-03-02')).toEqual('02/03/2023')
    })
  })
})
