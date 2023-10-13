import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { startOfToday } from 'date-fns'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import EndDateRoutes, { EndDate } from './endDate'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import { formatDatePickerDate } from '../../../../utils/datePickerUtils'

describe('Route Handlers - Edit allocation - End date', () => {
  const handler = new EndDateRoutes()
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
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        allocateJourney: {
          startDate: simpleDateFromDate(new Date()),
          activity: {
            name: 'Maths Level 1',
          },
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocate-to-activity/end-date')
    })
  })

  describe('POST', () => {
    it('should save entered end date in session and redirect to the check answers page', async () => {
      const endDate = startOfToday()

      req.body = { endDate }

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('/activities/allocate/pay-band')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const endDate = ''

      const body = { endDate }

      const requestObject = plainToInstance(EndDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'endDate', error: 'Enter a valid end date' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        endDate: 'a/1/2023',
      }

      const requestObject = plainToInstance(EndDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'endDate', error: 'Enter a valid end date' }])
    })

    it('validation fails if end date is not after or same as start date', async () => {
      const endDate = formatDatePickerDate(new Date('2023-08-24'))

      const request = {
        endDate,
        startDate: '2023-08-25',
        allocationId: 1,
        scheduleId: 1,
        prisonerNumber: 'ABC123',
        allocateJourney: {
          startDate: '2023-08-27',
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            scheduleId: 1,
          },
        },
      }

      const requestObject = plainToInstance(EndDate, request)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'endDate',
          error: `Enter a date on or after the allocation start date, 27/08/2023`,
        },
      ])
    })
  })
})
