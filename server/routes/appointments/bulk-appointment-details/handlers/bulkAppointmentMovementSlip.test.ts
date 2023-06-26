import { Request, Response } from 'express'

import BulkAppointmentMovementSlipRoutes from './bulkAppointmentMovementSlip'
import { AppointmentOccurrenceDetails, BulkAppointmentDetails } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

describe('Route Handlers - Movement Slip', () => {
  const handler = new BulkAppointmentMovementSlipRoutes()
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
        id: '10',
      },
      bulkAppointment: {
        occurrences: [],
      } as unknown as BulkAppointmentDetails,
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/movement-slip/bulk-appointment', {
        bulkAppointment: req.bulkAppointment,
      })
    })

    it('should only render movement slips for one occurrences that are not cancelled and not expired', async () => {
      req.bulkAppointment.occurrences = [
        {
          isCancelled: false,
          isExpired: true,
        } as unknown as AppointmentOccurrenceDetails,
        {
          isCancelled: true,
          isExpired: false,
        } as unknown as AppointmentOccurrenceDetails,
        {
          isCancelled: false,
          isExpired: false,
        } as unknown as AppointmentOccurrenceDetails,
      ]

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/movement-slip/bulk-appointment', {
        bulkAppointment: {
          occurrences: [
            {
              isCancelled: false,
              isExpired: false,
            } as unknown as AppointmentOccurrenceDetails,
          ],
        } as unknown as BulkAppointmentDetails,
      })
    })
  })
})
