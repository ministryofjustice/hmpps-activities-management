import { Request, Response } from 'express'

import AppointmentSetMovementSlipRoutes from './appointmentSetMovementSlip'
import { AppointmentDetails, AppointmentSetDetails } from '../../../../@types/activitiesAPI/types'
import MetricsService from '../../../../services/metricsService'

jest.mock('../../../../services/metricsService')

const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Appointment Set - Movement Slip', () => {
  const handler = new AppointmentSetMovementSlipRoutes(metricsService)
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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment-set/movement-slip', {
        appointmentSet: req.appointmentSet,
      })
    })

    it('should only render movement slips for appointments that are not cancelled and not expired', async () => {
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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment-set/movement-slip', {
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
