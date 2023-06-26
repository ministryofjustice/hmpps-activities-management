import { Request, Response } from 'express'

import RemovePayRoutes from './removePay'

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
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/remove-pay', {
        iep: 'Basic',
        bandId: 1,
      })
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
      expect(res.redirectWithSuccess).toHaveBeenCalledWith('check-pay', 'Basic incentive level rate Low removed')
    })

    it('should not remove pay rate if action not confirmed', async () => {
      req.body = { iep: 'Basic', bandId: '1', choice: 'no' }
      await handler.POST(req, res)
      expect(req.session.createJourney.pay).toEqual([
        { incentiveLevel: 'Standard', bandId: 1, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Standard', bandId: 2, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Basic', bandId: 1, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Basic', bandId: 2, bandAlias: 'Low', rate: 100 },
      ])
    })

    it("should not remove pay rate if pay rate isn't found", async () => {
      req.body = { iep: 'NonExistentLevel', bandId: '1', choice: 'yes' }
      await handler.POST(req, res)
      expect(req.session.createJourney.pay).toEqual([
        { incentiveLevel: 'Standard', bandId: 1, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Standard', bandId: 2, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Basic', bandId: 1, bandAlias: 'Low', rate: 100 },
        { incentiveLevel: 'Basic', bandId: 2, bandAlias: 'Low', rate: 100 },
      ])
    })
  })
})
