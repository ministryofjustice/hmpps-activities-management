import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays } from 'date-fns'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import DeallocateTodayOptionRoutes, { DeallocateToday } from './deallocateTodayOptions'
import { DeallocateTodayOption } from '../journey'
import {
  formatDatePickerDate,
  formatIsoDate,
  isoDateToDatePickerDate,
  parseDatePickerDate,
} from '../../../../utils/datePickerUtils'
import { EndDate } from './endDate'

describe('Route Handlers - Allocation - Deallocate Today option', () => {
  const handler = new DeallocateTodayOptionRoutes()
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
      routeContext: { mode: 'remove' },
      journeyData: {
        allocateJourney: {
          endDate: '2026-04-24',
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/deallocate-today-option', {
        nextAllocationToday: false,
      })
    })
  })

  describe('POST', () => {
    it('should redirect to reason if deallocate today option is TODAY', async () => {
      req.body = {
        deallocateTodayOption: 'TODAY',
      }

      await handler.POST(req, res)

      expect(req.journeyData.allocateJourney.deallocateTodayOption).toEqual(DeallocateTodayOption.TODAY)
      expect(req.journeyData.allocateJourney.endDate).toEqual(formatIsoDate(new Date()))
      expect(res.redirectOrReturn).toHaveBeenCalledWith('reason')
    })

    it('should redirect to reason if deallocate today option is is EOD', async () => {
      req.body = {
        deallocateTodayOption: 'EOD',
      }

      await handler.POST(req, res)

      expect(req.journeyData.allocateJourney.deallocateTodayOption).toEqual(DeallocateTodayOption.EOD)
      expect(req.journeyData.allocateJourney.endDate).toEqual(formatIsoDate(new Date()))
      expect(res.redirectOrReturn).toHaveBeenCalledWith('reason')
    })

    it('should redirect to reason if deallocate today option is FUTURE_DATE', async () => {
      req.body = {
        deallocateTodayOption: 'FUTURE_DATE',
        endDate: parseDatePickerDate('24/04/2026'),
      }

      await handler.POST(req, res)

      expect(req.journeyData.allocateJourney.deallocateTodayOption).toEqual(DeallocateTodayOption.FUTURE_DATE)
      expect(req.journeyData.allocateJourney.endDate).toEqual('2026-04-24')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('reason')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        deallocateTodayOption: '',
      }

      const requestObject = plainToInstance(DeallocateToday, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'deallocateTodayOption', error: 'Select when you want this allocation to end' },
      ])
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
          latestAllocationStartDate: formatIsoDate(addDays(new Date(), 2)),
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
          error: `Enter a date on or after the allocation start date, ${isoDateToDatePickerDate(
            request.allocateJourney.latestAllocationStartDate,
          )}`,
        },
      ])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        endDate: 'a/1/2023',
      }

      const requestObject = plainToInstance(EndDate, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'endDate', error: 'Enter a valid end date' }])
    })
  })
})
