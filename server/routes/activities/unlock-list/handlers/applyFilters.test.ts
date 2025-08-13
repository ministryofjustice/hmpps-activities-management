import { Request, Response } from 'express'
import ApplyFiltersRoutes from './applyFilters'

describe('Route Handlers - applyFilters', () => {
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
      journeyData: {
        unlockListJourney: {
          subLocationFilters: ['Original location'],
          activityFilter: 'Original activity filter',
          stayingOrLeavingFilter: 'Original staying or leaving filter',
          alertFilters: [],
          searchTerm: '',
        },
      },
    } as unknown as Request
  })

  describe('APPLY', () => {
    it('should apply populated list of filter', async () => {
      req.body = {
        locationFilters: ['A'],
        activityFilter: 'With',
        stayingOrLeavingFilter: 'Staying',
        alertFilters: ['ALERT_PEEP'],
        searchTerm: 'search term',
      }

      await handler.APPLY(req, res)

      expect(req.journeyData.unlockListJourney).toStrictEqual({
        subLocationFilters: ['A'],
        activityFilter: 'With',
        stayingOrLeavingFilter: 'Staying',
        alertFilters: ['ALERT_PEEP'],
        searchTerm: 'search term',
      })
    })

    it('should apply empty location filters', async () => {
      req.body = {
        locationFilters: [],
      }
      await handler.APPLY(req, res)

      expect(req.journeyData.unlockListJourney).toStrictEqual({
        subLocationFilters: [],
        activityFilter: 'Original activity filter',
        stayingOrLeavingFilter: 'Original staying or leaving filter',
        alertFilters: [],
        searchTerm: '',
      })
    })

    it('should not apply undefined filters', async () => {
      req.body = {}
      await handler.APPLY(req, res)

      expect(req.journeyData.unlockListJourney).toStrictEqual({
        subLocationFilters: ['Original location'],
        activityFilter: 'Original activity filter',
        stayingOrLeavingFilter: 'Original staying or leaving filter',
        alertFilters: [],
        searchTerm: '',
      })
    })
  })
})
