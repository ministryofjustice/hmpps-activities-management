import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import DeallocateTodayOptionRoutes, { DeallocateToday } from './deallocateTodayOptions'
import { DeallocateTodayOption } from '../journey'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'

describe('Route Handlers - Allocation - Deallocate Today option', () => {
  const handler = new DeallocateTodayOptionRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      routeContext: { mode: 'remove' },
      session: {
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
    it('should redirect to reason if deallocate today option is is TODAY', async () => {
      req.body = {
        deallocateTodayOption: 'TODAY',
      }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.deallocateTodayOption).toEqual(DeallocateTodayOption.TODAY)
      expect(req.session.allocateJourney.endDate).toEqual(formatIsoDate(new Date()))
      expect(res.redirectOrReturn).toHaveBeenCalledWith('reason')
    })

    it('should redirect to reason if deallocate today option is is FUTURE_DATE', async () => {
      req.body = {
        deallocateTodayOption: 'FUTURE_DATE',
        endDate: parseDatePickerDate('24/04/2026'),
      }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.deallocateTodayOption).toEqual(DeallocateTodayOption.FUTURE_DATE)
      expect(req.session.allocateJourney.endDate).toEqual('2026-04-24')
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
  })
})
