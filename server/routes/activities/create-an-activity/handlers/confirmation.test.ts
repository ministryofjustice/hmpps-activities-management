import { Request, Response } from 'express'
import ConfirmationRoutes from './confirmation'

describe('Route Handlers - Create an activity - Confirmation', () => {
  const handler = new ConfirmationRoutes()
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
      session: {
        createJourney: {},
        journeyMetrics: {},
      },
      params: {
        id: '1',
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/confirmation', { activityId: '1' })
      expect(req.session.createJourney).toBeNull()
    })
  })
})
