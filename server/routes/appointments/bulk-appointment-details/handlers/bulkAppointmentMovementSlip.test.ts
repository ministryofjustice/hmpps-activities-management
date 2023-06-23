import { Request, Response } from 'express'

import BulkAppointmentMovementSlipRoutes from './bulkAppointmentMovementSlip'
import { BulkAppointmentDetails } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

describe('Route Handlers - Movement Slip', () => {
  const handler = new BulkAppointmentMovementSlipRoutes()
  let req: Request
  let res: Response

  const bulkAppointment = {} as unknown as BulkAppointmentDetails

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
      bulkAppointment,
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/movement-slip/bulk-appointment', {
        bulkAppointment,
      })
    })
  })
})
