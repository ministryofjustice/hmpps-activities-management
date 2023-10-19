import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, startOfToday } from 'date-fns'
import RequestDateRoutes, { RequestDate } from './requestDate'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import { formatDatePickerDate, formatIsoDate } from '../../../../../utils/datePickerUtils'

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
      redirectOrReturn: jest.fn(),
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
      const today = startOfToday()
      req.body = {
        requestDate: today,
      }

      await handler.POST(req, res)

      expect(req.session.waitListApplicationJourney.requestDate).toEqual(formatIsoDate(today))
      expect(res.redirectOrReturn).toHaveBeenCalledWith(`activity`)
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const requestDate = ''

      const body = { requestDate }

      const requestObject = plainToInstance(RequestDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'requestDate', error: 'Enter a valid request date' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const requestDate = 'a/1/2023'

      const body = { requestDate }

      const requestObject = plainToInstance(RequestDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'requestDate', error: 'Enter a valid request date' }])
    })

    it('validation fails if request date is in the future', async () => {
      const tomorrow = addDays(new Date(), 1)
      const requestDate = formatDatePickerDate(tomorrow)

      const body = { requestDate }

      const requestObject = plainToInstance(RequestDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'requestDate', error: 'The request date cannot be in the future' }])
    })
  })
})
