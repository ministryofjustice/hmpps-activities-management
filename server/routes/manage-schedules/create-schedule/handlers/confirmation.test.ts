import { Request, Response } from 'express'
import ConfirmationRoutes from './confirmation'

describe('Route Handlers - Create an activity schedule - Confirmation', () => {
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
        createScheduleJourney: {},
      },
      params: {
        id: '1',
        scheduleId: '5',
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/manage-schedules/create-schedule/confirmation', {
        activityId: 1,
        scheduleId: 5,
      })
      expect(req.session.createScheduleJourney).toBeNull()
    })
  })
})
