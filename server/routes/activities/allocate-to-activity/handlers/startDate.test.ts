import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays } from 'date-fns'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import StartDateRoutes, { StartDate } from './startDate'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'

describe('Route Handlers - Edit allocation - Start date', () => {
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
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        allocateJourney: {
          inmate: {
            prisonerName: 'John Smith',
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocate-to-activity/start-date', {
        prisonerName: 'John Smith',
      })
    })
  })

  describe('POST', () => {
    it('should save entered start date in session and redirect to the end date option page', async () => {
      const today = new Date()
      const startDate = simpleDateFromDate(today)

      req.body = {
        startDate,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities/allocate/end-date-option')
    })
    it('should save entered start date in session and redirect to the check answers page', async () => {
      const today = new Date()
      const startDate = simpleDateFromDate(today)

      req.body = {
        startDate,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities/allocate/end-date-option')
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
      const startDate = simpleDateFromDate(yesterday)

      const body = {
        startDate,
      }

      const requestObject = plainToInstance(StartDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'startDate', error: "Enter a date after today's date" }])
    })
  })
})
