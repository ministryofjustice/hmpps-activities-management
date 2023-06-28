import { Request, Response } from 'express'
import ReviewPrisoners from './reviewPrisoners'
import { AppointmentType } from '../appointmentJourney'

describe('Route Handlers - Create Appointment - Review Prisoners', () => {
  const handler = new ReviewPrisoners()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      locals: {},
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
        bulkAppointmentJourney: {
          appointments: [],
        },
      },
      query: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the review prisoners view', async () => {
      const prisoners = [
        {
          number: 'A1234BC',
          name: '',
          cellLocation: '',
        },
        {
          number: 'B2345CD',
          name: '',
          cellLocation: '',
        },
      ]
      req.session.appointmentJourney.prisoners = prisoners
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners', { prisoners })
    })

    it('should render the review prisoners view with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
      const prisoners = [
        {
          number: 'A1234BC',
          name: '',
          cellLocation: '',
        },
        {
          number: 'B2345CD',
          name: '',
          cellLocation: '',
        },
      ]
      req.session.appointmentJourney.prisoners = prisoners
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners', {
        prisoners,
        preserveHistory: 'true',
      })
    })
  })

  describe('POST', () => {
    it('should redirect or return to category page', async () => {
      req.body = {
        howToAdd: 'SEARCH',
      }
      await handler.POST(req, res)
      expect(res.redirectOrReturn).toBeCalledWith('category')
    })

    it('should populate return to with schedule', async () => {
      req.query = { preserveHistory: 'true' }
      await handler.POST(req, res)
      expect(req.session.returnTo).toEqual('schedule?preserveHistory=true')
    })
  })

  describe('REMOVE', () => {
    it('should remove prisoner and redirect back to GET', async () => {
      req.session.appointmentJourney.prisoners = [
        {
          number: 'A1234BC',
          name: '',
          cellLocation: '',
        },
        {
          number: 'B2345CD',
          name: '',
          cellLocation: '',
        },
      ]

      req.params = {
        prisonNumber: 'B2345CD',
      }

      await handler.REMOVE(req, res)

      expect(req.session.appointmentJourney.prisoners).toEqual([
        {
          number: 'A1234BC',
          name: '',
          cellLocation: '',
        },
      ])
      expect(res.redirect).toBeCalledWith('../../review-prisoners')
    })

    it('should remove appointment and redirect back to GET', async () => {
      req.session.appointmentJourney.type = AppointmentType.BULK
      req.session.bulkAppointmentJourney.appointments = [
        {
          prisoner: {
            number: 'A1234BC',
            name: '',
            cellLocation: '',
          },
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: '',
            cellLocation: '',
          },
        },
      ]

      req.params = {
        prisonNumber: 'B2345CD',
      }

      await handler.REMOVE(req, res)

      expect(req.session.bulkAppointmentJourney.appointments).toEqual([
        {
          prisoner: {
            number: 'A1234BC',
            name: '',
            cellLocation: '',
          },
        },
      ])
      expect(res.redirect).toBeCalledWith('../../review-prisoners')
    })

    it('should redirect back to GET with preserve history', async () => {
      req.session.appointmentJourney.prisoners = []
      req.query = { preserveHistory: 'true' }
      req.params = {
        prisonNumber: 'B2345CD',
      }
      await handler.REMOVE(req, res)
      expect(res.redirect).toBeCalledWith('../../review-prisoners?preserveHistory=true')
    })
  })
})
