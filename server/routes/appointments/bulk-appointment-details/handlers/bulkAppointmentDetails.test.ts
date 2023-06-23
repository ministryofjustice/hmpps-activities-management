import { Request, Response } from 'express'
import BulkAppointmentDetailsRoutes from './bulkAppointmentDetails'
import { BulkAppointmentDetails } from '../../../../@types/activitiesAPI/types'

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
      bulkAppointment: {} as unknown as BulkAppointmentDetails,
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
      })
    })
  })
})
