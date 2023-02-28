import { Request, Response } from 'express'

import RemovePayRoutes from './removePay'

const flash = jest.fn()

describe('Route Handlers - Create an activity - Remove pay', () => {
  const handler = new RemovePayRoutes()
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
          pay: [
            { incentiveLevel: 'Standard', bandId: 1, bandAlias: 'Low', rate: 100 },
            { incentiveLevel: 'Standard', bandId: 2, bandAlias: 'Low', rate: 100 },
            { incentiveLevel: 'Basic', bandId: 1, bandAlias: 'Low', rate: 100 },
            { incentiveLevel: 'Basic', bandId: 2, bandAlias: 'Low', rate: 100 },
          ],
          incentiveLevels: ['Basic', 'Standard'],
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should show confirmation page', async () => {
      req.query = { iep: 'Basic', bandId: '1' }
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/remove-pay', { iep: 'Basic', bandId: 1 })
    })

    it("should redirect back to check pay page if pay rate isn't found", async () => {
      req.query = { iep: 'NonExistentLevel', bandId: '1' }
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('check-pay')
    })
  })

  describe('POST', () => {
    it('should remove specified pay rate', async () => {
      req.body = { iep: 'Basic', bandId: '1', choice: 'yes' }
      await handler.POST(req, res)
      expect(req.session.createJourney.pay).toEqual([
        { incentiveLevel: 'Standard', bandId: 1, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Standard', bandId: 2, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Basic', bandId: 2, bandAlias: 'Low', rate: 100 },
      ])
    })

    it('should redirect to check pay page', async () => {
      req.body = { iep: 'Basic', bandId: '1', choice: 'yes' }
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('check-pay')
    })

    it('should set success message', async () => {
      req.body = { iep: 'Basic', bandId: '1', choice: 'yes' }
      await handler.POST(req, res)
      expect(flash).toHaveBeenCalledWith(
        'successMessage',
        JSON.stringify({ message: 'Basic incentive level rate Low removed' }),
      )
    })

    it('should not remove pay rate or set success message if action not confirmed', async () => {
      req.body = { iep: 'Basic', bandId: '1', choice: 'no' }
      await handler.POST(req, res)
      expect(req.session.createJourney.pay).toEqual([
        { incentiveLevel: 'Standard', bandId: 1, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Standard', bandId: 2, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Basic', bandId: 1, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Basic', bandId: 2, bandAlias: 'Low', rate: 100 },
      ])
      expect(flash).toHaveBeenCalledTimes(0)
    })

    it("should not remove pay rate or set success message if pay rate isn't found", async () => {
      req.body = { iep: 'NonExistentLevel', bandId: '1', choice: 'yes' }
      await handler.POST(req, res)
      expect(req.session.createJourney.pay).toEqual([
        { incentiveLevel: 'Standard', bandId: 1, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Standard', bandId: 2, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Basic', bandId: 1, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Basic', bandId: 2, bandAlias: 'Low', rate: 100 },
      ])
      expect(flash).toHaveBeenCalledTimes(0)
    })
  })
})
