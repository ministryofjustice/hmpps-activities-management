import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, getDate, getMonth, getYear } from 'date-fns'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import StartDateRoutes, { StartDate } from './startDate'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'

describe('Route Handlers - Create an activity schedule - Start date', () => {
  const handler = new StartDateRoutes()
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
      expect(res.render).toHaveBeenCalledWith('pages/manage-schedules/create-schedule/start-date', {
        endDate: undefined,
      })
    })
  })

  describe('POST', () => {
    it('should save entered start date in session and redirect to the end date option page', async () => {
      const today = new Date()
      const startDate = plainToInstance(SimpleDate, {
        day: getDate(today),
        month: getMonth(today) + 1,
        year: getYear(today),
      })

      req.body = {
        startDate,
      }

      await handler.POST(req, res)

      expect(req.session.createScheduleJourney.startDate).toEqual(startDate)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('end-date-option')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const startDate = {
        day: '',
        month: '',
        year: '',
      }

      const body = {
        startDate,
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const startDate = {
        day: 'a',
        month: '1',
        year: '2023',
      }

      const body = {
        startDate,
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
    })

    it('validation fails if start date is in past', async () => {
      const yesterday = addDays(new Date(), -1)
      const startDate = plainToInstance(SimpleDate, {
        day: getDate(yesterday),
        month: getMonth(yesterday) + 1,
        year: getYear(yesterday),
      })

      const body = {
        startDate,
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: "Enter a date on or after today's date" }])
    })

    it('validation fails if start date is not before end date', async () => {
      const today = new Date()
      const startDate = plainToInstance(SimpleDate, {
        day: getDate(today),
        month: getMonth(today) + 1,
        year: getYear(today),
      })

      const body = {
        startDate,
        endDate: formatDate(today, 'yyyy-MM-dd'),
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: 'Enter a date before the end date' }])
    })
  })
})
