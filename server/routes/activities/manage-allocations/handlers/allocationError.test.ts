import { Request, Response } from 'express'

import AllocationErrorRoutes from './allocationError'

describe('Route Handlers - Allocation error', () => {
  const handler = new AllocationErrorRoutes()

  let req: Request
  const res = {
    render: jest.fn(),
  } as unknown as Response

  describe('GET', () => {
    it('should render error page', async () => {
      handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/allocation-error')
    })
  })
})
