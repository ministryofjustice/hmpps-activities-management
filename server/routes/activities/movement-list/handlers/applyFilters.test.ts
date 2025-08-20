import { Request, Response } from 'express'
import ApplyFiltersRoutes from './applyFilters'

describe('Route Handlers - Apply Filters', () => {
  const handler = new ApplyFiltersRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      get: jest.fn(),
      body: {
        alertFilters: ['ALERT_PEEP', 'CAT_A_PROVISIONAL'],
      },
      journeyData: {
        movementListJourney: {
          alertFilters: null,
        },
      },
    } as unknown as Request
  })

  describe('APPLY', () => {
    it('should apply filters', async () => {
      await handler.APPLY(req, res)
      expect(req.journeyData.movementListJourney).toStrictEqual({
        alertFilters: ['ALERT_PEEP', 'CAT_A_PROVISIONAL'],
      })
    })

    it('should apply empty filters', async () => {
      req.body.alertFilters = null
      await handler.APPLY(req, res)
      expect(req.journeyData.movementListJourney).toStrictEqual({
        alertFilters: [],
      })
    })
  })
})
