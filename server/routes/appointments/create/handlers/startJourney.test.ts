import { Request, Response } from 'express'
import { AppointmentType } from '../journey'
import StartJourneyRoutes from './startJourney'

describe('Route Handlers - Create Appointment - Start', () => {
  const handler = new StartJourneyRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {},
    } as unknown as Request
  })

  describe('SINGLE', () => {
    it('should populate the session with single appointment journey type and redirect to select prisoner page', async () => {
      await handler.SINGLE(req, res)

      expect(req.session.createAppointmentJourney).toEqual({ type: AppointmentType.SINGLE })
      expect(res.redirect).toHaveBeenCalledWith('select-prisoner')
    })
  })
})
