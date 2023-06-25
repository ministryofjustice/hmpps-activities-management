import { Request, Response } from 'express'
import ConfirmationRoutes from './confirmation'

describe('Route Handlers - Confirm deallocation', () => {
  const handler = new ConfirmationRoutes()

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        deallocateJourney: {
          deallocationReason: 'OTHER',
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/deallocate-from-activity/confirmation', {
        deallocateJourney: { deallocationReason: 'OTHER' },
      })
      expect(req.session.deallocateJourney).toBeNull()
    })
  })
})
