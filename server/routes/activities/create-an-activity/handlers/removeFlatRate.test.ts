import { Request, Response } from 'express'

import RemoveFlatRateRoutes from './removeFlatRate'

describe('Route Handlers - Create an activity - Remove flat rate', () => {
  const handler = new RemoveFlatRateRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
      query: {},
      session: {
        createJourney: {
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          riskLevel: 'High',
          flat: [{ bandId: 1, bandAlias: 'Low', rate: 100 }],
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should show confirmation page', async () => {
      req.query = { bandId: '1' }
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/remove-pay', { bandId: 1 })
    })

    it("should redirect back to check pay page if pay rate isn't found", async () => {
      req.query = { bandId: '2' }
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('check-pay')
    })
  })

  describe('POST', () => {
    it('should remove specified flat rate', async () => {
      req.body = { bandId: '1', choice: 'yes' }
      await handler.POST(req, res)
      expect(req.session.createJourney.flat).toEqual([])
    })

    it('should redirect to check pay page', async () => {
      req.body = { bandId: '1', choice: 'yes' }
      await handler.POST(req, res)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith('check-pay', 'Flat rate Low removed')
    })

    it('should not remove pay rate if action not confirmed', async () => {
      req.body = { bandId: '1', choice: 'no' }
      await handler.POST(req, res)
      expect(req.session.createJourney.flat).toEqual([{ bandId: 1, bandAlias: 'Low', rate: 100 }])
    })

    it("should not remove pay rate if pay rate isn't found", async () => {
      req.body = { bandId: '2', choice: 'yes' }
      await handler.POST(req, res)
      expect(req.session.createJourney.flat).toEqual([{ bandId: 1, bandAlias: 'Low', rate: 100 }])
    })
  })
})
