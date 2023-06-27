import { Request, Response } from 'express'
import BulkAppointmentDetailsRoutes from './bulkAppointmentDetails'
import { AppointmentOccurrenceDetails, BulkAppointmentDetails } from '../../../../@types/activitiesAPI/types'

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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/bulk-appointment-details/bulk-appointment', {
        bulkAppointment: req.bulkAppointment,
        showPrintMovementSlipsLink: false,
      })
    })

    it('should render print movement slips link when at least one occurrence is not cancelled and not expired', async () => {
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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/bulk-appointment-details/bulk-appointment', {
        bulkAppointment: req.bulkAppointment,
        showPrintMovementSlipsLink: true,
      })
    })

    it('should not render print movement slips link when all occurrences are either cancelled, expired or both', async () => {
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
          isCancelled: true,
          isExpired: true,
        } as unknown as AppointmentOccurrenceDetails,
      ]

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/bulk-appointment-details/bulk-appointment', {
        bulkAppointment: req.bulkAppointment,
        showPrintMovementSlipsLink: false,
      })
    })
  })
})
