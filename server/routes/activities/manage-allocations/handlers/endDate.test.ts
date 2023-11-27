import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, startOfToday } from 'date-fns'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import EndDateRoutes, { EndDate } from './endDate'
import { formatDatePickerDate, formatIsoDate, isoDateToDatePickerDate } from '../../../../utils/datePickerUtils'

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
      params: { mode: 'create' },
      session: {
        allocateJourney: {
          startDate: formatIsoDate(new Date()),
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/end-date')
    })
  })

  describe('POST', () => {
    it('should redirect to the pay band page if in create mode', async () => {
      req.params.mode = 'create'

      const endDate = startOfToday()
      req.body = { endDate }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.endDate).toEqual(formatIsoDate(req.body.endDate))
      expect(res.redirectOrReturn).toHaveBeenCalledWith('pay-band')
    })

    it('should redirect to the deallocate reason page in edit mode', async () => {
      req.params.mode = 'edit'

      const endDate = startOfToday()
      req.body = { endDate }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.endDate).toEqual(formatIsoDate(req.body.endDate))
      expect(res.redirectOrReturn).toHaveBeenCalledWith('reason')
    })

    it('should redirect to the deallocate reason page in remove mode', async () => {
      req.params.mode = 'remove'

      const endDate = startOfToday()
      req.body = { endDate }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.endDate).toEqual(formatIsoDate(req.body.endDate))
      expect(res.redirectOrReturn).toHaveBeenCalledWith('reason')
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

    it('validation fails if end date is not same or after latest allocation start date', async () => {
      const endDate = formatDatePickerDate(addDays(new Date(), 1))

      const request = {
        endDate,
        startDate: '2023-08-25',
        allocationId: 1,
        scheduleId: 1,
        prisonerNumber: 'ABC123',
        allocateJourney: {
          startDate: formatIsoDate(addDays(new Date(), 2)),
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            scheduleId: 1,
          },
          latestAllocationStartDate: formatIsoDate(addDays(new Date(), 2)),
        },
      }

      const requestObject = plainToInstance(EndDate, request)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'endDate',
          error: `Enter a date on or after the allocation start date, ${isoDateToDatePickerDate(
            request.allocateJourney.latestAllocationStartDate,
          )}`,
        },
      ])
    })
  })
})
