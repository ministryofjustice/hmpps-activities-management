import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays } from 'date-fns'
import { NextFunction } from 'express-serve-static-core'
import createHttpError from 'http-errors'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import DaysAndTimesRoutes, { DaysAndTimes } from './daysAndTimes'
import ActivitiesService from '../../../../services/activitiesService'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import { validateSlotChanges } from '../../../../utils/helpers/activityScheduleValidator'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../utils/helpers/activityScheduleValidator')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const findActivitySlotErrorsMock = validateSlotChanges as jest.MockedFunction<typeof validateSlotChanges>

describe('Route Handlers - Create an activity schedule - Days and times', () => {
  const handler = new DaysAndTimesRoutes(activitiesService)
  let req: Request
  let res: Response
  let next: NextFunction
  const startDate = addDays(new Date(), 1)
  const endDate = addDays(new Date(), 8)

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
      addValidationError: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {
          startDate: formatIsoDate(startDate),
          endDate: formatIsoDate(endDate),
        },
      },
      body: {},
      params: {},
      query: {},
    } as unknown as Request

    next = jest.fn()

    findActivitySlotErrorsMock.mockReturnValue([])
  })

  describe('GET', () => {
    it('should render the expected view if week number is valid', async () => {
      req.session.createJourney.scheduleWeeks = 1
      req.params.weekNumber = '1'

      await handler.GET(req, res, next)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/days-and-times', {
        currentWeek: null,
      })
    })

    it.each([
      ['greater than schedule weeks', '3'],
      ['less than 1', '0'],
      ['a decimal', '1.1'],
      ['not a valid number', 'invalid'],
    ])('should render 404 error if week number is %s', async (desc: string, weekNumber: string) => {
      req.session.createJourney.scheduleWeeks = 2
      req.params.weekNumber = weekNumber

      await handler.GET(req, res, next)
      expect(next).toHaveBeenCalledWith(createHttpError.NotFound())
    })

    it.each([
      ['greater than schedule weeks', '3'],
      ['less than 1', '0'],
      ['a decimal', '1.1'],
      ['not a valid number', 'invalid'],
    ])('should render 404 error if week number is %s', async (desc: string, weekNumber: string) => {
      req.session.createJourney.scheduleWeeks = 2
      req.params.weekNumber = weekNumber

      await handler.GET(req, res, next)
      expect(next).toHaveBeenCalledWith(createHttpError.NotFound())
    })
  })

  describe('POST', () => {
    describe('Create journey', () => {
      it('should save slots in session and redirect to bank holiday page if last week in schedule', async () => {
        req.session.createJourney.scheduleWeeks = 1
        req.params = {
          weekNumber: '1',
        }
        req.body = {
          days: ['tuesday', 'friday'],
          timeSlotsTuesday: ['AM'],
          timeSlotsFriday: ['PM', 'ED'],
        }

        await handler.POST(req, res, next)

        expect(req.session.createJourney.slots['1'].days).toEqual(['tuesday', 'friday'])
        expect(req.session.createJourney.slots['1'].timeSlotsTuesday).toEqual(['AM'])
        expect(req.session.createJourney.slots['1'].timeSlotsFriday).toEqual(['PM', 'ED'])
        expect(res.redirect).toHaveBeenCalledWith('../bank-holiday-option')
      })

      it("should save slots in session and redirect to next week's slots if not last week in schedule", async () => {
        req.session.createJourney.scheduleWeeks = 2
        req.params = {
          weekNumber: '1',
        }
        req.body = {
          days: ['tuesday', 'friday'],
          timeSlotsTuesday: ['AM'],
          timeSlotsFriday: ['PM', 'ED'],
        }

        await handler.POST(req, res, next)

        expect(req.session.createJourney.slots['1'].days).toEqual(['tuesday', 'friday'])
        expect(req.session.createJourney.slots['1'].timeSlotsTuesday).toEqual(['AM'])
        expect(req.session.createJourney.slots['1'].timeSlotsFriday).toEqual(['PM', 'ED'])
        expect(res.redirect).toHaveBeenCalledWith('2')
      })
    })

    describe("Edit a week's slots from check answers page", () => {
      it('should save slots in session and redirect back to check answers page', async () => {
        req.session.createJourney.scheduleWeeks = 2
        req.params = {
          weekNumber: '1',
        }
        req.query = {
          preserveHistory: 'true',
        }
        req.body = {
          days: ['tuesday', 'friday'],
          timeSlotsTuesday: ['AM'],
          timeSlotsFriday: ['PM', 'ED'],
        }

        await handler.POST(req, res, next)

        expect(req.session.createJourney.slots['1'].days).toEqual(['tuesday', 'friday'])
        expect(req.session.createJourney.slots['1'].timeSlotsTuesday).toEqual(['AM'])
        expect(req.session.createJourney.slots['1'].timeSlotsFriday).toEqual(['PM', 'ED'])
        expect(res.redirect).toHaveBeenCalledWith('../check-answers')
      })
    })

    describe("Edit a week's slots when editing schedule frequency from check answers page", () => {
      it("should save slots to session and redirect to next week's slots", async () => {
        req.session.createJourney.scheduleWeeks = 2
        req.params = {
          weekNumber: '1',
        }
        req.query = {
          preserveHistory: 'true',
          fromScheduleFrequency: 'true',
        }
        req.body = {
          days: ['tuesday', 'friday'],
          timeSlotsTuesday: ['AM'],
          timeSlotsFriday: ['PM', 'ED'],
        }

        await handler.POST(req, res, next)

        expect(req.session.createJourney.slots['1'].days).toEqual(['tuesday', 'friday'])
        expect(req.session.createJourney.slots['1'].timeSlotsTuesday).toEqual(['AM'])
        expect(req.session.createJourney.slots['1'].timeSlotsFriday).toEqual(['PM', 'ED'])
        expect(res.redirect).toHaveBeenCalledWith('2?preserveHistory=true&fromScheduleFrequency=true')
      })

      it('should save slots to session and redirect back to check answers page', async () => {
        req.session.createJourney.scheduleWeeks = 2
        req.params = {
          weekNumber: '2',
        }
        req.query = {
          preserveHistory: 'true',
          fromScheduleFrequency: 'true',
        }
        req.body = {
          days: ['tuesday', 'friday'],
          timeSlotsTuesday: ['AM'],
          timeSlotsFriday: ['PM', 'ED'],
        }

        await handler.POST(req, res, next)

        expect(req.session.createJourney.slots['2'].days).toEqual(['tuesday', 'friday'])
        expect(req.session.createJourney.slots['2'].timeSlotsTuesday).toEqual(['AM'])
        expect(req.session.createJourney.slots['2'].timeSlotsFriday).toEqual(['PM', 'ED'])
        expect(res.redirect).toHaveBeenCalledWith('../check-answers')
      })
    })

    describe("Edit a week's slots from activity details page", () => {
      it('should save slots when editing existing activity', async () => {
        req = {
          session: {
            createJourney: {
              activityId: 1,
              name: 'Maths level 1',
              slots: {},
              scheduleWeeks: 2,
            },
          },
          params: {
            weekNumber: '1',
            mode: 'edit',
          },
          query: {
            preserveHistory: true,
          },
          body: {
            days: ['tuesday', 'friday'],
            timeSlotsTuesday: ['AM'],
            timeSlotsFriday: ['PM', 'ED'],
          },
        } as unknown as Request

        await handler.POST(req, res, next)

        const expectedActivityUpdate = {
          scheduleWeeks: 2,
          slots: [
            { weekNumber: 1, timeSlot: 'AM', tuesday: true },
            { weekNumber: 1, timeSlot: 'PM', friday: true },
            { weekNumber: 1, timeSlot: 'ED', friday: true },
          ],
        }

        expect(activitiesService.updateActivity).toHaveBeenCalledWith(
          req.session.createJourney.activityId,
          expectedActivityUpdate,
          res.locals.user,
        )

        expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
          '/activities/view/1',
          'Activity updated',
          "You've updated the daily schedule for Maths level 1",
        )
      })

      it("should update session and redirect to next week's slots when editing schedule frequency", async () => {
        req = {
          session: {
            createJourney: {
              activityId: 1,
              name: 'Maths level 1',
              slots: {},
              scheduleWeeks: 2,
            },
          },
          params: {
            weekNumber: '1',
          },
          query: {
            preserveHistory: 'true',
            fromScheduleFrequency: 'true',
          },
          body: {
            days: ['tuesday', 'friday'],
            timeSlotsTuesday: ['AM'],
            timeSlotsFriday: ['PM', 'ED'],
          },
        } as unknown as Request

        await handler.POST(req, res, next)

        expect(req.session.createJourney.slots).toEqual({
          '1': {
            days: ['tuesday', 'friday'],
            timeSlotsMonday: [],
            timeSlotsTuesday: ['AM'],
            timeSlotsWednesday: [],
            timeSlotsThursday: [],
            timeSlotsFriday: ['PM', 'ED'],
            timeSlotsSaturday: [],
            timeSlotsSunday: [],
          },
        })

        expect(res.redirect).toBeCalledWith('2?preserveHistory=true&fromScheduleFrequency=true')
      })
    })

    it.each([
      ['greater than schedule weeks', '3'],
      ['less than 1', '0'],
      ['a decimal', '1.1'],
      ['not a valid number', 'invalid'],
    ])('should render 404 error if week number is %s', async (desc: string, weekNumber: string) => {
      req.session.createJourney.scheduleWeeks = 2
      req.params.weekNumber = weekNumber

      await handler.POST(req, res, next)
      expect(next).toHaveBeenCalledWith(createHttpError.NotFound())
    })
  })

  describe('type validation', () => {
    it('validation fails if no slots selected for a day', async () => {
      const body = {
        days: ['tuesday', 'friday'],
        timeSlotsFriday: ['PM', 'ED'],
      }

      const requestObject = plainToInstance(DaysAndTimes, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'timeSlotsTuesday', error: 'Select at least one time slot for Tuesday' }])
    })
  })

  describe('slots validation', () => {
    it('validation fails if any slots are outside date range', async () => {
      req.session.createJourney.scheduleWeeks = 1
      req.params = {
        weekNumber: '1',
      }
      req.body = {
        days: ['tuesday', 'friday'],
        timeSlotsTuesday: ['AM'],
        timeSlotsFriday: ['PM', 'ED'],
      }

      findActivitySlotErrorsMock.mockReturnValue([{ weekNumber: 1, day: 'Monday' }])

      await handler.POST(req, res, next)

      const startDateStr = formatDate(startDate)
      const endDateStr = formatDate(endDate)
      expect(res.addValidationError).toBeCalledTimes(1)
      expect(res.addValidationError).toHaveBeenCalledWith(
        'timeSlotsMonday',
        `You cannot select Monday. This is because the activity starts on ${startDateStr} and ends on ${endDateStr}`,
      )
      expect(res.validationFailed).toBeCalledTimes(1)
    })
  })
})
