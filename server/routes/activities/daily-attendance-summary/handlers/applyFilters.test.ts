import { Request, Response } from 'express'
import ApplyFiltersRoutes from './applyFilters'
import AttendanceReason from '../../../../enum/attendanceReason'

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
          reasonFilter: 'Original reason',
          searchTerm: 'Original search',
        },
      },
    } as unknown as Request
  })

  describe('APPLY', () => {
    it('should apply populated list of filter', async () => {
      req.body = {
        categoryFilters: ['Prison Jobs'],
        reasonFilter: 'SUSPENDED',
        searchTerm: 'search',
        absenceReasonFilters: [AttendanceReason.SICK],
        payFilters: ['true'],
      }
      await handler.APPLY(req, res)

      expect(req.session.attendanceSummaryJourney).toStrictEqual({
        categoryFilters: ['Prison Jobs'],
        reasonFilter: 'SUSPENDED',
        searchTerm: 'search',
        absenceReasonFilters: [AttendanceReason.SICK],
        payFilters: ['true'],
      })
    })

    it('should apply empty filters', async () => {
      req.body = {
        categoryFilters: [],
        reasonFilter: '',
        searchTerm: '',
        absenceReasonFilters: [],
        payFilters: [],
      }
      await handler.APPLY(req, res)

      expect(req.session.attendanceSummaryJourney).toStrictEqual({
        categoryFilters: [],
        reasonFilter: '',
        searchTerm: '',
        absenceReasonFilters: [],
        payFilters: [],
      })
    })
  })
})
