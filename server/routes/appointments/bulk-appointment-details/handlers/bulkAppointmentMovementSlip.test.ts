import { Request, Response } from 'express'

import BulkAppointmentMovementSlipRoutes from './bulkAppointmentMovementSlip'
import { AppointmentDetails, AppointmentSetDetails } from '../../../../@types/activitiesAPI/types'

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
        id: '12',
        occurrences: [],
      } as unknown as AppointmentSetDetails,
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/movement-slip/bulk-appointment', {
        bulkAppointment: req.appointmentSet,
      })
    })

    it('should only render movement slips for occurrences that are not cancelled and not expired', async () => {
      req.appointmentSet.occurrences = [
        {
          isCancelled: false,
          isExpired: true,
        } as unknown as AppointmentDetails,
        {
          isCancelled: true,
          isExpired: false,
        } as unknown as AppointmentDetails,
        {
          isCancelled: false,
          isExpired: false,
        } as unknown as AppointmentDetails,
      ]

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/movement-slip/bulk-appointment', {
        bulkAppointment: {
          id: '12',
          occurrences: [
            {
              isCancelled: false,
              isExpired: false,
            } as unknown as AppointmentDetails,
          ],
        } as unknown as AppointmentSetDetails,
      })
    })
  })
})
