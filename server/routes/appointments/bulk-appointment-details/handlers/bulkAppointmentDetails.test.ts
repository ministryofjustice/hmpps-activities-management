import { Request, Response } from 'express'
import BulkAppointmentDetailsRoutes from './bulkAppointmentDetails'
import { AppointmentDetails, AppointmentSetDetails } from '../../../../@types/activitiesAPI/types'

describe('Route Handlers - Bulk Appointment Details', () => {
  const handler = new BulkAppointmentDetailsRoutes()
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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/bulk-appointment-details/bulk-appointment', {
        appointmentSet: req.appointmentSet,
        showPrintMovementSlipsLink: false,
      })
    })

    it('should render print movement slips link when at least one occurrence is not cancelled and not expired', async () => {
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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/bulk-appointment-details/bulk-appointment', {
        appointmentSet: req.appointmentSet,
        showPrintMovementSlipsLink: true,
      })
    })

    it('should not render print movement slips link when all occurrences are either cancelled, expired or both', async () => {
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
          isCancelled: true,
          isExpired: true,
        } as unknown as AppointmentDetails,
      ]

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/bulk-appointment-details/bulk-appointment', {
        appointmentSet: req.appointmentSet,
        showPrintMovementSlipsLink: false,
      })
    })
  })
})
