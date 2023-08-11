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
        attendanceSummaryJourney: {
          categoryFilters: ['Original category'],
          activityFilters: ['Original Activity'],
          searchTerm: 'Original search',
        },
      },
    } as unknown as Request
  })

  describe('APPLY', () => {
    it('should apply populated list of filter', async () => {
      req.body = {
        categoryFilters: ['Prison Jobs'],
        activityFilters: ['Activity One'],
        searchTerm: ['search'],
      }
      await handler.APPLY(req, res)

      expect(req.session.attendanceSummaryJourney).toStrictEqual({
        categoryFilters: ['Prison Jobs'],
        activityFilters: ['Activity One'],
        searchTerm: 'search',
      })
    })

    it('should apply empty filters', async () => {
      req.body = {
        categoryFilters: [],
        activityFilters: [],
        searchTerm: [''],
      }
      await handler.APPLY(req, res)

      expect(req.session.attendanceSummaryJourney).toStrictEqual({
        categoryFilters: [],
        activityFilters: [],
        searchTerm: '',
      })
    })

    it('should not apply undefined filters', async () => {
      req.body = {}
      await handler.APPLY(req, res)

      expect(req.session.attendanceSummaryJourney).toStrictEqual({
        categoryFilters: ['Original category'],
        activityFilters: ['Original Activity'],
        searchTerm: '',
      })
    })
  })
})
