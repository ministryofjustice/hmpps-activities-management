import { Request, Response } from 'express'
import StartJourneyRoutes from './startJourney'

describe('Route Handlers - Create an activity - Start', () => {
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
      query: { preserveHistory: 'true' },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should populate the session with journey data and redirect to the pay band page', async () => {
      await handler.GET(req, res)

      expect(req.session.createJourney).toEqual({})
      expect(res.redirect).toHaveBeenCalledWith('category?preserveHistory=true')
    })
  })
})
