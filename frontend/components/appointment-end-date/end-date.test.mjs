import { calculateEndDate } from './end-date'

describe('Appointment end date', () => {
  describe('Weekday', () => {
    it.each([
        ['1 appointment, starts Saturday', new Date('2023-04-22 00:00:00'), 1, new Date('2023-04-22 00:00:00')],
        ['2 appointments, starts Saturday, skips Sunday', new Date('2023-04-22 00:00:00'), 2, new Date('2023-04-24 00:00:00')],
        ['1 appointment, starts Sunday', new Date('2023-04-23 00:00:00'), 1, new Date('2023-04-23 00:00:00')],
        ['2 appointments, starts Sunday', new Date('2023-04-23 00:00:00'), 2, new Date('2023-04-24 00:00:00')],
        ['7 appointments, starts Saturday, skips Sunday and weekend', new Date('2023-04-22 00:00:00'), 7, new Date('2023-05-01 00:00:00')],
        ['5 appointments, Monday - Friday', new Date('2023-04-24'), 5, new Date('2023-04-28')],
        ['6 appointments, Monday - Monday, skips weekend', new Date('2023-04-24 00:00:00'), 6, new Date('2023-05-01 00:00:00')],
        ['20 appointments', new Date('2023-04-24 00:00:00'), 20, new Date('2023-05-19 00:00:00')],
      ],
    )(`should return correct end date (%s)`, (_, startDate, appointments, expectedEndDate) => {
      const endDate = calculateEndDate(startDate, 'WEEKDAY', appointments)
      expect(endDate).toEqual(expectedEndDate)
    })
  })

  describe('Daily', () => {
    it.each([
        ['1 appointment, starts Saturday', new Date('2023-04-22 00:00:00'), 1, new Date('2023-04-22 00:00:00')],
        ['2 appointments, starts Saturday, ends Sunday', new Date('2023-04-22 00:00:00'), 2, new Date('2023-04-23 00:00:00')],
        ['7 appointment, Monday - Sunday', new Date('2023-04-24 00:00:00'), 7, new Date('2023-04-30 00:00:00')],
      ],
    )(`should return correct end date (%s)`, (_, startDate, appointments, expectedEndDate) => {
      const endDate = calculateEndDate(startDate, 'DAILY', appointments)
      expect(endDate).toEqual(expectedEndDate)
    })
  })

  describe('Weekly', () => {
    it.each([
        ['1 appointment', new Date('2023-04-24 00:00:00'), 1, new Date('2023-04-24 00:00:00')],
        ['2 appointments', new Date('2023-04-24 00:00:00'), 2, new Date('2023-05-01 00:00:00')],
        ['10 appointment', new Date('2023-04-24 00:00:00'), 10, new Date('2023-06-26 00:00:00')],
      ],
    )(`should return correct end date (%s)`, (_, startDate, appointments, expectedEndDate) => {
      const endDate = calculateEndDate(startDate, 'WEEKLY', appointments)
      expect(endDate).toEqual(expectedEndDate)
    })
  })

  describe('Monthly', () => {
    it.each([
        ['1 appointment', new Date('2023-04-24 00:00:00'), 1, new Date('2023-04-24 00:00:00')],
        ['2 appointments', new Date('2023-04-24 00:00:00'), 2, new Date('2023-05-24 00:00:00')],
        ['3 appointment, with timezone change', new Date('2023-02-24 00:00:00'), 3, new Date('2023-04-24 00:00:00')],
        ['3 appointments, invalid end date (30 Feb)', new Date('2024-12-30 00:00:00'), 3, new Date('2025-02-28 00:00:00')],
        ['3 appointments, invalid end date (30 Feb), leap year', new Date('2023-12-30 00:00:00'), 3, new Date('2024-02-29 00:00:00')],
      ],
    )(`should return correct end date (%s)`, (_, startDate, appointments, expectedEndDate) => {
      const endDate = calculateEndDate(startDate, 'MONTHLY', appointments)
      expect(endDate).toEqual(expectedEndDate)
    })
  })
})
