import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays } from 'date-fns'
import RequestDateRoutes, { RequestDate } from './requestDate'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'

describe('Route Handlers - Waitlist application - Request date', () => {
  const handler = new RequestDateRoutes()
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
      session: { waitListApplicationJourney: {} },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the request date template', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(`pages/activities/waitlist-application/request-date`)
    })
  })

  describe('POST', () => {
    it('should set the request date in session and redirect to the activity route', async () => {
      req.body = {
        requestDate: {
          day: '1',
          month: '1',
          year: '2023',
        },
      }

      await handler.POST(req, res)

      expect(req.session.waitListApplicationJourney.requestDate).toEqual({
        day: '1',
        month: '1',
        year: '2023',
      })
      expect(res.redirect).toHaveBeenCalledWith(`activity`)
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const requestDate = {
        day: '',
        month: '',
        year: '',
      }

      const body = {
        requestDate,
      }

      const requestObject = plainToInstance(RequestDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'requestDate', error: 'Enter a valid request date' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const requestDate = {
        day: 'a',
        month: '1',
        year: '2023',
      }

      const body = {
        requestDate,
      }

      const requestObject = plainToInstance(RequestDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'requestDate', error: 'Enter a valid request date' }])
    })

    it('validation fails if request date is in the future', async () => {
      const tomorrow = addDays(new Date(), 1)
      const requestDate = simpleDateFromDate(tomorrow)

      const body = {
        requestDate,
      }

      const requestObject = plainToInstance(RequestDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'requestDate', error: 'Enter a date which is not in the future' }])
    })
  })
})
