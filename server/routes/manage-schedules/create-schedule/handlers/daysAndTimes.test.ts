import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import DaysAndTimesRoutes, { DaysAndTimes } from './daysAndTimes'

describe('Route Handlers - Create an activity schedule - Days and times', () => {
  const handler = new DaysAndTimesRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createScheduleJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/manage-schedules/create-schedule/days-and-times')
    })
  })

  describe('POST', () => {
    it('should save entered days and times in session and redirect to the location page', async () => {
      req.body = {
        days: ['tuesday', 'friday'],
        timeSlotsTuesday: ['AM'],
        timeSlotsFriday: ['PM', 'ED'],
      }

      await handler.POST(req, res)

      expect(req.session.createScheduleJourney.days).toEqual(['tuesday', 'friday'])
      expect(req.session.createScheduleJourney.timeSlotsTuesday).toEqual(['AM'])
      expect(req.session.createScheduleJourney.timeSlotsFriday).toEqual(['PM', 'ED'])
      expect(res.redirectOrReturn).toHaveBeenCalledWith('bank-holiday-option')
    })
  })

  describe('type validation', () => {
    it('validation fails if a day is not selected', async () => {
      const body = {
        timeSlotsTuesday: ['AM'],
        timeSlotsFriday: ['PM', 'ED'],
      }

      const requestObject = plainToInstance(DaysAndTimes, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'days', error: 'Select at least one day' }])
    })

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
