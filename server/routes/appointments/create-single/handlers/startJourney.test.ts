import { Request, Response } from 'express'
import StartJourneyRoutes from './startJourney'

describe('Route Handlers - Create Single Appointment - Start', () => {
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

  describe('GET', () => {
    it('should populate the session with journey data and redirect to select prisoner page', async () => {
      await handler.GET(req, res)

      expect(req.session.createSingleAppointmentJourney).toEqual({})
      expect(res.redirect).toHaveBeenCalledWith('select-prisoner')
    })
  })
})
