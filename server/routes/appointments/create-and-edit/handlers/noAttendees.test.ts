import { Request, Response } from 'express'
import NoAttendees from './noAttendees'

describe('Route Handlers - Duplicate Appointment - No Attendees', () => {
  const handler = new NoAttendees()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render correct view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/no-attendees', {
        appointmentJourney: req.session.appointmentJourney,
      })
    })
  })

  describe('POST', () => {
    it('should redirect to how to add prisoners page when user click continue', async () => {
      await handler.POST(req, res)

      expect(res.redirect).toBeCalledWith('how-to-add-prisoners')
    })
  })
})
