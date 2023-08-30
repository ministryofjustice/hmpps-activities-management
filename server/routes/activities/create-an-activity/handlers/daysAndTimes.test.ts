import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays } from 'date-fns'
import { NextFunction } from 'express-serve-static-core'
import createHttpError from 'http-errors'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import DaysAndTimesRoutes, { DaysAndTimes } from './daysAndTimes'
import ActivitiesService from '../../../../services/activitiesService'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity schedule - Days and times', () => {
  const handler = new DaysAndTimesRoutes(activitiesService)
  let req: Request
  let res: Response
  let next: NextFunction

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
    } as unknown as Response

    req = {
      session: {
        createJourney: {
          startDate: simpleDateFromDate(addDays(new Date(), 1)),
        },
      },
      body: {},
      params: {},
      query: {},
    } as unknown as Request

    next = jest.fn()
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
          },
          query: {
            preserveHistory: true,
            fromEditActivity: true,
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

        expect(activitiesService.updateActivity).toBeCalledWith(
          res.locals.user.activeCaseLoadId,
          req.session.createJourney.activityId,
          expectedActivityUpdate,
        )

        expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
          '/activities/schedule/activities/1',
          'Activity updated',
          "We've updated the daily schedule for Maths level 1",
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
            fromEditActivity: 'true',
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

        expect(res.redirect).toBeCalledWith('2?preserveHistory=true&fromScheduleFrequency=true&fromEditActivity=true')
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
})
