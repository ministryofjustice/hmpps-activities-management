import { Request, Response } from 'express'
import ConfirmationRoutes from './confirmation'

describe('Route Handlers - Allocate - Confirmation', () => {
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
        allocateJourney: {
          inmate: {
            prisonerName: 'Joe Bloggs',
            prisonerNumber: 'ABC123',
            cellLocation: '1-2-001',
            payBand: 'A',
          },
          activity: {
            activityId: 1,
            scheduleId: 1,
            name: 'Maths',
            location: 'Education room 1',
          },
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page with data from session', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/confirmation', {
        activityId: 1,
        scheduleId: 1,
        prisonerName: 'Joe Bloggs',
        prisonerNumber: 'ABC123',
        activityName: 'Maths',
      })
      expect(req.session.allocateJourney).toBeNull()
    })
  })
})
