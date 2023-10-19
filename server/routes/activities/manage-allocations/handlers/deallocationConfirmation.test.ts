import { Request, Response } from 'express'
import DeallocationConfirmationRoutes from './deallocationConfirmation'

describe('Route Handlers - Confirm deallocation', () => {
  const handler = new DeallocationConfirmationRoutes()

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
      session: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
    })
  })
})
