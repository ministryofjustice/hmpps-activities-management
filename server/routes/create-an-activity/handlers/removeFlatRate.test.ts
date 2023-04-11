import { Request, Response } from 'express'

import RemoveFlatRateRoutes from './removeFlatRate'

const flash = jest.fn()

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
    } as unknown as Response

    req = {
      flash,
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
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/remove-pay', { bandId: 1 })
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
      expect(res.redirect).toHaveBeenCalledWith('check-pay')
    })

    it('should set success message', async () => {
      req.body = { bandId: '1', choice: 'yes' }
      await handler.POST(req, res)
      expect(flash).toHaveBeenCalledWith('successMessage', JSON.stringify({ message: 'Flat rate Low removed' }))
    })

    it('should not remove pay rate or set success message if action not confirmed', async () => {
      req.body = { bandId: '1', choice: 'no' }
      await handler.POST(req, res)
      expect(req.session.createJourney.flat).toEqual([{ bandId: 1, bandAlias: 'Low', rate: 100 }])
      expect(flash).toHaveBeenCalledTimes(0)
    })

    it("should not remove pay rate or set success message if pay rate isn't found", async () => {
      req.body = { bandId: '2', choice: 'yes' }
      await handler.POST(req, res)
      expect(req.session.createJourney.flat).toEqual([{ bandId: 1, bandAlias: 'Low', rate: 100 }])
      expect(flash).toHaveBeenCalledTimes(0)
    })
  })
})
