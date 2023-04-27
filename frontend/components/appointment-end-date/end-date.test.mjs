import { calculateEndDate } from './end-date'

describe('Appointment end date', () => {
  describe('Weekday', () => {
    it.each([
        ['1 occurrence, starts Saturday', new Date('2023-04-22 00:00:00'), 1, new Date('2023-04-22 00:00:00')],
        ['2 occurrences, starts Saturday, skips Sunday', new Date('2023-04-22 00:00:00'), 2, new Date('2023-04-24 00:00:00')],
        ['1 occurrence, starts Sunday', new Date('2023-04-23 00:00:00'), 1, new Date('2023-04-23 00:00:00')],
        ['2 occurrences, starts Sunday', new Date('2023-04-23 00:00:00'), 2, new Date('2023-04-24 00:00:00')],
        ['7 occurrences, starts Saturday, skips Sunday and weekend', new Date('2023-04-22 00:00:00'), 7, new Date('2023-05-01 00:00:00')],
        ['5 occurrences, Monday - Friday', new Date('2023-04-24'), 5, new Date('2023-04-28')],
        ['6 occurrences, Monday - Monday, skips weekend', new Date('2023-04-24 00:00:00'), 6, new Date('2023-05-01 00:00:00')],
        ['20 occurrences', new Date('2023-04-24 00:00:00'), 20, new Date('2023-05-19 00:00:00')],
      ],
    )(`should return correct end date (%s)`, (_, startDate, occurrences, expectedEndDate) => {
      const endDate = calculateEndDate(startDate, 'WEEKDAY', occurrences)
      expect(endDate).toEqual(expectedEndDate)
    })
  })

  describe('Daily', () => {
    it.each([
        ['1 occurrence, starts Saturday', new Date('2023-04-22 00:00:00'), 1, new Date('2023-04-22 00:00:00')],
        ['2 occurrences, starts Saturday, ends Sunday', new Date('2023-04-22 00:00:00'), 2, new Date('2023-04-23 00:00:00')],
        ['7 occurrence, Monday - Sunday', new Date('2023-04-24 00:00:00'), 7, new Date('2023-04-30 00:00:00')],
      ],
    )(`should return correct end date (%s)`, (_, startDate, occurrences, expectedEndDate) => {
      const endDate = calculateEndDate(startDate, 'DAILY', occurrences)
      expect(endDate).toEqual(expectedEndDate)
    })
  })

  describe('Weekly', () => {
    it.each([
        ['1 occurrence', new Date('2023-04-24 00:00:00'), 1, new Date('2023-04-24 00:00:00')],
        ['2 occurrences', new Date('2023-04-24 00:00:00'), 2, new Date('2023-05-01 00:00:00')],
        ['10 occurrence', new Date('2023-04-24 00:00:00'), 10, new Date('2023-06-26 00:00:00')],
      ],
    )(`should return correct end date (%s)`, (_, startDate, occurrences, expectedEndDate) => {
      const endDate = calculateEndDate(startDate, 'WEEKLY', occurrences)
      expect(endDate).toEqual(expectedEndDate)
    })
  })

  describe('Monthly', () => {
    it.each([
        ['1 occurrence', new Date('2023-04-24 00:00:00'), 1, new Date('2023-04-24 00:00:00')],
        ['2 occurrences', new Date('2023-04-24 00:00:00'), 2, new Date('2023-05-24 00:00:00')],
        ['3 occurrence, with timezone change', new Date('2023-02-24 00:00:00'), 3, new Date('2023-04-24 00:00:00')],
        ['3 occurrences, invalid end date (30 Feb)', new Date('2024-12-30 00:00:00'), 3, new Date('2025-02-28 00:00:00')],
        ['3 occurrences, invalid end date (30 Feb), leap year', new Date('2023-12-30 00:00:00'), 3, new Date('2024-02-29 00:00:00')],
      ],
    )(`should return correct end date (%s)`, (_, startDate, occurrences, expectedEndDate) => {
      const endDate = calculateEndDate(startDate, 'MONTHLY', occurrences)
      expect(endDate).toEqual(expectedEndDate)
    })
  })
})
