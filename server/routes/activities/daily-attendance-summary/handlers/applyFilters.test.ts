import { Request, Response } from 'express'
import ApplyFiltersRoutes from './applyFilters'
import AttendanceReason from '../../../../enum/attendanceReason'
import { PayNoPay } from '../../../../@types/activities'

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
    beforeEach(() => {
      req.session.attendanceSummaryJourney = {
        categoryFilters: ['Education'],
        reasonFilter: 'BOTH',
        searchTerm: undefined,
        absenceReasonFilters: [AttendanceReason.CLASH],
        payFilters: [PayNoPay.PAID],
      }
    })

    describe('when view is not absences', () => {
      it('should apply populated list of filter', async () => {
        req.body = {
          categoryFilters: ['Prison Jobs'],
          reasonFilter: 'SUSPENDED',
          searchTerm: 'search',
          absenceReasonFilters: [AttendanceReason.SICK],
          payFilters: ['true'],
          isAbsencesFilter: undefined,
        }

        await handler.APPLY(req, res)

        expect(req.session.attendanceSummaryJourney).toStrictEqual({
          categoryFilters: ['Prison Jobs'],
          reasonFilter: 'SUSPENDED',
          searchTerm: 'search',
          absenceReasonFilters: undefined,
          payFilters: undefined,
        })
      })

      it('should apply empty filters', async () => {
        req.body = {
          categoryFilters: [],
          reasonFilter: '',
          searchTerm: '',
          absenceReasonFilters: [],
          payFilters: [],
          isAbsencesFilter: undefined,
        }
        await handler.APPLY(req, res)

        expect(req.session.attendanceSummaryJourney).toStrictEqual({
          categoryFilters: [],
          reasonFilter: '',
          searchTerm: '',
          absenceReasonFilters: undefined,
          payFilters: undefined,
        })
      })
    })

    describe('when view is absences', () => {
      it('should apply populated list of filter', async () => {
        req.body = {
          categoryFilters: ['Prison Jobs'],
          reasonFilter: 'SUSPENDED',
          searchTerm: 'search',
          absenceReasonFilters: [AttendanceReason.SICK],
          payFilters: ['true'],
          isAbsencesFilter: true,
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
          isAbsencesFilter: true,
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
})
