import { Request, Response } from 'express'
import StartJourneyRoutes from './startJourney'

describe('Route Handlers - Create an activity schedule - Start', () => {
  const handler = new StartJourneyRoutes()
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
      session: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should populate the session with journey data and redirect to the name page', async () => {
      await handler.GET(req, res)

      expect(req.session.createScheduleJourney).toEqual({})
      expect(res.redirect).toHaveBeenCalledWith('name')
    })
  })
})
