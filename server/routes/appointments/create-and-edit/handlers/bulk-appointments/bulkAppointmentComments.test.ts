import { Request, Response } from 'express'
import { BulkAppointmentJourney } from '../../bulkAppointmentJourney'
import BulkAppointmentCommentsRoutes from './bulkAppointmentComments'

describe('Route Handlers - Create Bulk Appointment - Add Comment', () => {
  const handler = new BulkAppointmentCommentsRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        bulkAppointmentJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('retrieves prisoner appointments and renders comments page with correct context', async () => {
      const testPrisonerAppointments = [
        {
          prisoner: {
            number: 'A1234BC',
          },
          comment: 'An appointment comment',
        },
        {
          prisoner: {
            number: 'Z4321YX',
          },
          comment: 'Another appointment comment',
        },
      ] as BulkAppointmentJourney['appointments']
      req.session.bulkAppointmentJourney.appointments = testPrisonerAppointments

      handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/appointments/create-and-edit/bulk-appointments/bulk-appointment-comments',
        {
          appointments: testPrisonerAppointments,
        },
      )
    })
  })

  describe('POST', () => {
    it('redirects to the check answers page', async () => {
      handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })
})
