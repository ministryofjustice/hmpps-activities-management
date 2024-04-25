import { addDays, addWeeks, nextFriday, nextThursday, nextWednesday } from 'date-fns'
import { CreateAnActivityJourney } from '../../routes/activities/create-an-activity/journey'
import { formatIsoDate } from '../datePickerUtils'
import {
  validateSlotChanges,
  ActivityTimeSlotValidationError,
  isStartDateValid,
  isEndDateValid,
  getNearestInvalidStartDate,
  getNearestInvalidEndDate,
} from './activityScheduleValidator'
import 'jest-date'

describe('Activity TIme Slot Validator', () => {
  const today = new Date()
  // Starts next Tuesday
  const activityStartDate = addDays(today, (7 - today.getDay() + 2) % 7)
  // Ends following Thursday
  let activityEndDate: Date
  let createJourney: CreateAnActivityJourney

  beforeEach(() => {
    activityEndDate = addDays(activityStartDate, 2)

    createJourney = {
      startDate: formatIsoDate(activityStartDate),
      endDate: formatIsoDate(activityEndDate),
      endDateOption: 'yes',
      slots: {},
    } as CreateAnActivityJourney
  })

  const validateErrors = (errors: ActivityTimeSlotValidationError[], weekNumber: number, ...days: string[]) => {
    days.forEach(day =>
      expect(errors).toContainEqual({
        weekNumber,
        day,
      }),
    )
  }

  describe('Validate Slot Changes', () => {
    describe('1 week', () => {
      beforeEach(() => {
        createJourney.scheduleWeeks = 1
      })

      it('should be valid if there end date is null', async () => {
        createJourney.endDate = null
        createJourney.slots['1'] = { days: ['monday', 'thursday'] }

        expect(validateSlotChanges(createJourney, 1)).toHaveLength(0)
      })

      it('should be valid if there end date is undefined', async () => {
        createJourney.endDate = undefined
        createJourney.slots['1'] = { days: ['monday', 'thursday'] }

        expect(validateSlotChanges(createJourney, 1)).toHaveLength(0)
      })

      it('should be valid if date range is 14 days', async () => {
        createJourney.slots['1'] = { days: ['monday', 'thursday'] }

        createJourney.endDate = formatIsoDate(addWeeks(activityStartDate, 2))

        expect(validateSlotChanges(createJourney, 1)).toHaveLength(0)
      })

      it('should be valid if all slots are within start and end dates', async () => {
        createJourney.slots['1'] = { days: ['tuesday', 'wednesday', 'thursday'] }

        expect(validateSlotChanges(createJourney, 1)).toHaveLength(0)
      })

      it('should fail because Monday slot is before Tuesday start date falls after Thursday end date', async () => {
        createJourney.slots['1'] = { days: ['monday', 'thursday'] }

        const errors = validateSlotChanges(createJourney, 1)

        expect(errors).toHaveLength(1)
        validateErrors(errors, 1, 'Monday')
      })

      it('should fail because Friday slot is after Thursday end date', async () => {
        createJourney.slots['1'] = { days: ['tuesday', 'friday'] }

        const errors = validateSlotChanges(createJourney, 1)

        expect(errors).toHaveLength(1)
        validateErrors(errors, 1, 'Friday')
      })

      it('should fail because Monday and Friday slots are after Thursday end date', async () => {
        createJourney.slots['1'] = { days: ['monday', 'tuesday', 'friday'] }

        const errors = validateSlotChanges(createJourney, 1)

        expect(errors).toHaveLength(2)
        validateErrors(errors, 1, 'Monday', 'Friday')
      })

      describe('2 week', () => {
        beforeEach(() => {
          activityEndDate = addDays(activityStartDate, 9)

          createJourney.endDate = formatIsoDate(activityEndDate)
          createJourney.scheduleWeeks = 2
        })

        it('should be valid if all first week slots are within start and end dates', async () => {
          createJourney.slots['1'] = { days: ['tuesday', 'wednesday', 'thursday'] }

          expect(validateSlotChanges(createJourney, 1)).toHaveLength(0)
        })

        it('should be valid if all second week slots are within start and end dates', async () => {
          createJourney.slots['1'] = { days: ['tuesday', 'wednesday', 'thursday'] }
          createJourney.slots['2'] = { days: ['tuesday', 'wednesday', 'thursday'] }

          expect(validateSlotChanges(createJourney, 1)).toHaveLength(0)
        })

        it('first week should fail because Monday slot is before Tuesday start date falls after Thursday end date', async () => {
          createJourney.slots['1'] = { days: ['monday', 'friday'] }

          const errors = validateSlotChanges(createJourney, 1)

          expect(errors).toHaveLength(1)
          validateErrors(errors, 1, 'Monday')
        })

        it('second week should fail because Friday slot is after Thursday end date', async () => {
          createJourney.slots['1'] = { days: ['thursday'] }
          createJourney.slots['2'] = { days: ['monday', 'friday'] }

          const errors = validateSlotChanges(createJourney, 2)

          expect(errors).toHaveLength(1)
          validateErrors(errors, 2, 'Friday')
        })
      })
    })
  })

  describe('Date Range Checks', () => {
    beforeEach(() => {
      createJourney.endDate = formatIsoDate(addDays(activityStartDate, 9))
      createJourney.scheduleWeeks = 2
      createJourney.slots['1'] = { days: ['thursday'] }
      createJourney.slots['2'] = { days: ['monday', 'thursday'] }
    })

    describe('Validate Date Changes', () => {
      describe('Start Date Change', () => {
        it('should succeed as new date range can accommodate slots', async () => {
          const newStartDate = nextThursday(activityStartDate)

          expect(isStartDateValid(createJourney, newStartDate)).toBe(true)
        })

        it('should fail as new date range is too small', async () => {
          const newStartDate = nextFriday(activityStartDate)

          expect(isStartDateValid(createJourney, newStartDate)).toBe(false)
        })
      })

      describe('End Date Change', () => {
        it('should succeed as new date range can accommodate slots', async () => {
          const newEndDate = addDays(activityStartDate, 9)

          expect(isEndDateValid(createJourney, newEndDate)).toBe(true)
        })

        it('should fail as new date range is too small', async () => {
          const newEndDate = addDays(activityStartDate, 7)

          expect(isEndDateValid(createJourney, newEndDate)).toBe(false)
        })
      })
    })

    describe('Get Nearest Invalid Date', () => {
      it('should retrieve nearest invalid start date', async () => {
        expect(getNearestInvalidStartDate(createJourney)).toBeSameDayAs(nextFriday(activityStartDate))
      })

      it('should retrieve nearest invalid end date', async () => {
        expect(getNearestInvalidEndDate(createJourney)).toBeSameDayAs(addWeeks(nextWednesday(activityStartDate), 1))
      })
    })
  })
})
