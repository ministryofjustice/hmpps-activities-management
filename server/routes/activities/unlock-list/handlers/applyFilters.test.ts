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
      session: {
        unlockListJourney: {
          subLocationFilters: ['Original location'],
          activityFilter: 'Original activity filter',
          stayingOrLeavingFilter: 'Original staying or leaving filter',
          showAlerts: false,
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
        showAlerts: 'true',
        searchTerm: 'search term',
      }

      await handler.APPLY(req, res)

      expect(req.session.unlockListJourney).toStrictEqual({
        subLocationFilters: ['A'],
        activityFilter: 'With',
        stayingOrLeavingFilter: 'Staying',
        showAlerts: true,
        searchTerm: 'search term',
      })
    })

    it('should apply empty location filters', async () => {
      req.body = {
        locationFilters: [],
      }
      await handler.APPLY(req, res)

      expect(req.session.unlockListJourney).toStrictEqual({
        subLocationFilters: [],
        activityFilter: 'Original activity filter',
        stayingOrLeavingFilter: 'Original staying or leaving filter',
        showAlerts: false,
        searchTerm: '',
      })
    })

    it('should not apply undefined filters', async () => {
      req.body = {}
      await handler.APPLY(req, res)

      expect(req.session.unlockListJourney).toStrictEqual({
        subLocationFilters: ['Original location'],
        activityFilter: 'Original activity filter',
        stayingOrLeavingFilter: 'Original staying or leaving filter',
        showAlerts: false,
        searchTerm: '',
      })
    })
  })
})
