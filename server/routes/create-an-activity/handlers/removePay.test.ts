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
            { incentiveLevel: 'Standard', bandId: 1, rate: 100 },
            { incentiveLevel: 'Standard', bandId: 2, rate: 100 },
            { incentiveLevel: 'Basic', bandId: 1, rate: 100 },
            { incentiveLevel: 'Basic', bandId: 2, rate: 100 },
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
    it('should remove specified pay and redirect', async () => {
      req.query = { iep: 'Basic', bandId: '1' }
      await handler.GET(req, res)
      expect(req.session.createJourney.pay).toEqual([
        { incentiveLevel: 'Standard', bandId: 1, rate: 100 },
        { incentiveLevel: 'Standard', bandId: 2, rate: 100 },
        { incentiveLevel: 'Basic', bandId: 2, rate: 100 },
      ])
      expect(res.redirect).toHaveBeenCalledWith('check-pay')
    })
  })
})
