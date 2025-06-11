import { when } from 'jest-when'
import atLeast from '../../../jest.setup'
import { ServiceUser } from '../../@types/express'
import { CreateAnActivityJourney } from '../../routes/activities/create-an-activity/journey'
import { WeeklyCustomTimeSlots } from './activityTimeSlotMappers'
import ActivityDateValidator from './activityDateValidator'
import BankHolidayService from '../../services/bankHolidayService'

jest.mock('../../services/bankHolidayService')
const bankHolidayService = new BankHolidayService(null, null) as jest.Mocked<BankHolidayService>

describe('Activity Date Validator', () => {
  const handler = new ActivityDateValidator(bankHolidayService)
  const user = { activeCaseLoadId: 'MDI', username: 'USER1', displayName: 'John Smith' } as ServiceUser
  let createJourney: CreateAnActivityJourney

  beforeEach(() => {
    createJourney = {
      slots: {},
    } as CreateAnActivityJourney

    const mockBankHolidaysList = [
      new Date('2025-01-01'),
      new Date('2025-04-18'),
      new Date('2025-04-21'),
      new Date('2025-05-05'),
      new Date('2025-05-26'),
    ]
    when(bankHolidayService.getUkBankHolidays).calledWith(atLeast(user)).mockResolvedValueOnce(mockBankHolidaysList)
  })

  describe('Validate activity date for create activity journey', () => {
    describe('1 week', () => {
      beforeEach(() => {
        createJourney.startDate = '2025-05-05'
        createJourney.endDate = '2025-05-11'
        createJourney.scheduleWeeks = 1
        createJourney.slots['1'] = { days: ['monday', 'thursday'] }
      })

      it('should be valid if the end date is null', async () => {
        createJourney.endDate = null

        expect(await handler.hasAtLeastOneValidDay(createJourney, user)).toEqual(true)
      })

      it('should be valid if the end date is undefined', async () => {
        createJourney.endDate = undefined

        expect(await handler.hasAtLeastOneValidDay(createJourney, user)).toEqual(true)
      })

      it('should be valid if the activity occurs at least on one non-bank holiday', async () => {
        createJourney.endDate = '2025-05-11'

        expect(await handler.hasAtLeastOneValidDay(createJourney, user)).toEqual(true)
      })

      it('should be invalid if the activity occurs only on bank holidays', async () => {
        createJourney.slots['1'] = { days: ['monday'] }

        expect(await handler.hasAtLeastOneValidDay(createJourney, user)).toEqual(false)
      })

      it('should be invalid if the schedule weeks is null', async () => {
        createJourney.scheduleWeeks = null

        expect(await handler.hasAtLeastOneValidDay(createJourney, user)).toEqual(false)
      })

      it('should be invalid if the schedule weeks is undefined', async () => {
        createJourney.scheduleWeeks = undefined

        expect(await handler.hasAtLeastOneValidDay(createJourney, user)).toEqual(false)
      })
    })

    describe('2 weeks', () => {
      beforeEach(() => {
        createJourney.startDate = '2025-04-15'
        createJourney.scheduleWeeks = 2
        createJourney.slots['1'] = { days: ['monday', 'thursday'] }
        createJourney.slots['2'] = { days: ['tuesday', 'saturday'] }
      })

      it('should be valid if the end date is null', async () => {
        createJourney.endDate = null

        expect(await handler.hasAtLeastOneValidDay(createJourney, user)).toEqual(true)
      })

      it('should be valid if the end date is undefined', async () => {
        createJourney.endDate = undefined

        expect(await handler.hasAtLeastOneValidDay(createJourney, user)).toEqual(true)
      })

      it('should be invalid if the activity occurs only on bank holidays', async () => {
        createJourney.endDate = '2025-04-24'
        createJourney.slots['1'] = { days: ['friday'] }
        createJourney.slots['2'] = { days: ['monday'] }

        expect(await handler.hasAtLeastOneValidDay(createJourney, user)).toEqual(false)
      })

      it('should be valid if the activity occurs at least on one non-bank holiday', async () => {
        createJourney.endDate = '2025-05-11'

        expect(await handler.hasAtLeastOneValidDay(createJourney, user)).toEqual(true)
      })
    })
  })

  describe('Validate activity date for edit activity journey', () => {
    describe('1 week', () => {
      const startDate = '2025-05-05'
      let scheduleWeeks = 1
      let slots = {
        '1': [
          {
            day: 'Monday',
            slots: [
              {
                timeSlot: 'AM',
                startTime: '10:00',
                endTime: '11:00',
              },
            ],
          },
          {
            day: 'Thursday',
            slots: [
              {
                timeSlot: 'PM',
                startTime: '15:00',
                endTime: '16:00',
              },
            ],
          },
        ],
      } as WeeklyCustomTimeSlots

      it('should be valid if the end date is null', async () => {
        const endDate = null

        expect(await handler.hasAtLeastOneValidDayInActivity(startDate, endDate, scheduleWeeks, slots, user)).toEqual(
          true,
        )
      })

      it('should be valid if the end date is undefined', async () => {
        const endDate = undefined

        expect(await handler.hasAtLeastOneValidDayInActivity(startDate, endDate, scheduleWeeks, slots, user)).toEqual(
          true,
        )
      })

      it('should be invalid if the activity occurs only on bank holidays', async () => {
        const endDate = '2025-05-11'
        slots = {
          '1': [
            {
              day: 'Monday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
          ],
        } as WeeklyCustomTimeSlots

        expect(await handler.hasAtLeastOneValidDayInActivity(startDate, endDate, scheduleWeeks, slots, user)).toEqual(
          false,
        )
      })

      it('should be valid if the activity occurs at least on one non-bank holiday', async () => {
        const endDate = '2025-05-11'
        slots = {
          '1': [
            {
              day: 'Monday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Thursday',
              slots: [
                {
                  timeSlot: 'PM',
                  startTime: '15:00',
                  endTime: '16:00',
                },
              ],
            },
          ],
        } as WeeklyCustomTimeSlots

        expect(await handler.hasAtLeastOneValidDayInActivity(startDate, endDate, scheduleWeeks, slots, user)).toEqual(
          true,
        )
      })

      it('should be valid if the schedule weeks is undefined', async () => {
        scheduleWeeks = undefined
        const endDate = '2025-05-11'

        expect(await handler.hasAtLeastOneValidDayInActivity(startDate, endDate, scheduleWeeks, slots, user)).toEqual(
          false,
        )
      })

      it('should be valid if the schedule weeks is null', async () => {
        scheduleWeeks = null
        const endDate = '2025-05-11'

        expect(await handler.hasAtLeastOneValidDayInActivity(startDate, endDate, scheduleWeeks, slots, user)).toEqual(
          false,
        )
      })
    })

    describe('2 weeks', () => {
      const startDate = '2025-04-15'
      const scheduleWeeks = 2
      let slots = {
        '1': [
          {
            day: 'Monday',
            slots: [
              {
                timeSlot: 'AM',
                startTime: '10:00',
                endTime: '11:00',
              },
            ],
          },
          {
            day: 'Thursday',
            slots: [
              {
                timeSlot: 'PM',
                startTime: '15:00',
                endTime: '16:00',
              },
            ],
          },
        ],
        '2': [
          {
            day: 'Tuesday',
            slots: [
              {
                timeSlot: 'AM',
                startTime: '10:00',
                endTime: '11:00',
              },
            ],
          },
          {
            day: 'Saturday',
            slots: [
              {
                timeSlot: 'PM',
                startTime: '15:00',
                endTime: '16:00',
              },
            ],
          },
        ],
      } as WeeklyCustomTimeSlots

      it('should be valid if the end date is null', async () => {
        const endDate = null

        expect(await handler.hasAtLeastOneValidDayInActivity(startDate, endDate, scheduleWeeks, slots, user)).toEqual(
          true,
        )
      })

      it('should be valid if the end date is undefined', async () => {
        const endDate = undefined

        expect(await handler.hasAtLeastOneValidDayInActivity(startDate, endDate, scheduleWeeks, slots, user)).toEqual(
          true,
        )
      })

      it('should be invalid if the activity occurs only on bank holidays', async () => {
        const endDate = '2025-04-24'
        slots = {
          '1': [
            {
              day: 'Friday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
          ],
          '2': [
            {
              day: 'Monday',
              slots: [
                {
                  timeSlot: 'PM',
                  startTime: '14:00',
                  endTime: '17:00',
                },
              ],
            },
          ],
        } as WeeklyCustomTimeSlots

        expect(await handler.hasAtLeastOneValidDayInActivity(startDate, endDate, scheduleWeeks, slots, user)).toEqual(
          false,
        )
      })

      it('should be valid if the activity occurs at least on one non-bank holiday', async () => {
        const endDate = '2025-05-11'

        expect(await handler.hasAtLeastOneValidDayInActivity(startDate, endDate, scheduleWeeks, slots, user)).toEqual(
          true,
        )
      })
    })
  })
})
