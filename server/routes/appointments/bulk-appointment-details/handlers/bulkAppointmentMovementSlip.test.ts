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
      appointmentSet: {
        id: '12',
        appointments: [],
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
        appointmentSet: req.appointmentSet,
      })
    })

    it('should only render movement slips for occurrences that are not cancelled and not expired', async () => {
      req.appointmentSet.appointments = [
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
        appointmentSet: {
          id: '12',
          appointments: [
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
