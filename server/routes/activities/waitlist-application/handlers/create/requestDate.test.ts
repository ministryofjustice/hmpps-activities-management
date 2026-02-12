import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, startOfToday, subDays } from 'date-fns'
import RequestDateRoutes, { RequestDate } from './requestDate'
import { associateErrorsWithProperty, formatDate } from '../../../../../utils/utils'
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
      journeyData: { waitListApplicationJourney: {} },
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

      expect(req.journeyData.waitListApplicationJourney.requestDate).toEqual(formatIsoDate(today))
      expect(res.redirectOrReturn).toHaveBeenCalledWith(`activity`)
    })
    it('allows a date exactly 30 days in the past', async () => {
      const thirtyDays = subDays(startOfToday(), 30)
      req.body = { requestDate: thirtyDays }

      await handler.POST(req, res)

      expect(req.journeyData.waitListApplicationJourney.requestDate).toEqual(formatIsoDate(thirtyDays))
      expect(res.redirectOrReturn).toHaveBeenCalledWith(`activity`)
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const requestDate = ''

      const body = { requestDate }

      const requestObject = plainToInstance(RequestDate, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'requestDate', error: 'Enter a valid request date' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const requestDate = 'a/1/2023'

      const body = { requestDate }

      const requestObject = plainToInstance(RequestDate, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'requestDate', error: 'Enter a valid request date' }])
    })

    it('validation fails if date is more than 30 days into the past', async () => {
      const thirtyDaysAgo = subDays(new Date(), 30)
      const requestDate = formatDatePickerDate(thirtyDaysAgo)
      const thirtyDaysAgoMessageDate = formatDate(subDays(startOfToday(), 30))
      const body = { requestDate }

      const requestObject = plainToInstance(RequestDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'requestDate', error: `The date must be between ${thirtyDaysAgoMessageDate} and today.` },
      ])
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
