import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, startOfToday, subDays } from 'date-fns'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import EndDateRoutes, { EndDate } from './endDate'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'

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
    } as unknown as Response

    req = {
      params: {
        allocationId: 1,
      },
      session: {
        allocateJourney: {
          startDate: '2099-12-15',
          endDate: '2099-12-31',
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            scheduleId: 1,
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocation-dashboard/end-date')
    })
  })

  describe('POST', () => {
    it('should save entered end date in session and redirect to the reason page', async () => {
      const today = new Date()
      const endDate = simpleDateFromDate(today)

      req.body = {
        endDate,
        startDate: formatDate(subDays(today, 1), 'yyyy-MM-dd'),
        allocationId: 1,
        scheduleId: 1,
        prisonerNumber: 'ABC123',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('reason')
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
      const endDate = 'a/1/2023'

      const body = { endDate }

      const requestObject = plainToInstance(EndDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'endDate', error: 'Enter a valid end date' }])
    })

    it('validation fails if end date is not after or same as start date', async () => {
      const tomorrow = addDays(startOfToday(), 1)
      const nextWeek = addDays(startOfToday(), 7)
      const endDate = formatDatePickerDate(tomorrow)

      const request = {
        endDate,
        allocateJourney: {
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            startDate: formatIsoDate(nextWeek),
            scheduleId: 1,
          },
        },
      }

      const requestObject = plainToInstance(EndDate, request)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'endDate',
          error: `Enter a date on or after the activity's start date, ${formatDatePickerDate(nextWeek)}`,
        },
      ])
    })

    it('validation passes if end date is same as start date', async () => {
      const tomorrow = addDays(new Date(), 1)
      const endDate = formatDatePickerDate(tomorrow)

      const request = {
        endDate,
        allocateJourney: {
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            scheduleId: 1,
            startDate: formatIsoDate(tomorrow),
          },
        },
      }

      const requestObject = plainToInstance(EndDate, request)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('validation passes if end date is after start date', async () => {
      const today = new Date()
      const tomorrow = addDays(today, 1)

      const request = {
        endDate: formatDatePickerDate(tomorrow),
        allocateJourney: {
          startDate: formatIsoDate(today),
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

      expect(errors).toHaveLength(0)
    })
  })
})
