import { Request, Response } from 'express'
import ApplyFiltersRoutes from './applyFilters'
import AttendanceReason from '../../../../enum/attendanceReason'
import { AbsencePayFilter } from '../../../../@types/activities'

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
        attendanceSummaryJourney: {
          activityTypeFilters: ['inPrison'],
          categoryFilters: ['Original category'],
          reasonFilter: 'Original reason',
          searchTerm: 'Original search',
        },
      },
    } as unknown as Request
  })

  describe('APPLY', () => {
    beforeEach(() => {
      req.journeyData.attendanceSummaryJourney = {
        activityTypeFilters: ['inPrison'],
        categoryFilters: ['Education'],
        reasonFilter: 'BOTH',
        searchTerm: undefined,
        absenceReasonFilters: [AttendanceReason.CLASH],
        payFilters: AbsencePayFilter.ANY_PAY,
      }
    })

    describe('when view is not absences', () => {
      it('should apply populated list of filter', async () => {
        req.body = {
          activityTypeFilters: ['inPrison'],
          categoryFilters: ['Prison Jobs'],
          reasonFilter: 'SUSPENDED',
          searchTerm: 'search',
          absenceReasonFilters: [AttendanceReason.SICK],
          payFilters: AbsencePayFilter.ANY_PAY,
          isAbsencesFilter: undefined,
        }

        await handler.APPLY(req, res)

        expect(req.journeyData.attendanceSummaryJourney).toStrictEqual({
          categoryFilters: ['Prison Jobs'],
          reasonFilter: 'SUSPENDED',
          searchTerm: 'search',
          activityTypeFilters: ['inPrison'],
          absenceReasonFilters: undefined,
          payFilters: undefined,
        })
      })

      it('should apply empty filters', async () => {
        req.body = {
          activityTypeFilters: [],
          categoryFilters: [],
          reasonFilter: '',
          searchTerm: '',
          absenceReasonFilters: [],
          payFilters: [],
          isAbsencesFilter: undefined,
        }
        await handler.APPLY(req, res)

        expect(req.journeyData.attendanceSummaryJourney).toStrictEqual({
          activityTypeFilters: [],
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
          activityTypeFilters: ['inPrison'],
          categoryFilters: ['Prison Jobs'],
          reasonFilter: 'SUSPENDED',
          searchTerm: 'search',
          absenceReasonFilters: [AttendanceReason.SICK],
          payFilters: AbsencePayFilter.ANY_PAY,
          isAbsencesFilter: true,
        }

        await handler.APPLY(req, res)

        expect(req.journeyData.attendanceSummaryJourney).toStrictEqual({
          categoryFilters: ['Prison Jobs'],
          reasonFilter: 'SUSPENDED',
          searchTerm: 'search',
          absenceReasonFilters: [AttendanceReason.SICK],
          payFilters: AbsencePayFilter.ANY_PAY,
          activityTypeFilters: ['inPrison'],
        })
      })

      it('should apply empty filters', async () => {
        req.body = {
          categoryFilters: [],
          reasonFilter: '',
          searchTerm: '',
          absenceReasonFilters: [],
          payFilters: [],
          activityTypeFilters: [],
          isAbsencesFilter: true,
        }
        await handler.APPLY(req, res)

        expect(req.journeyData.attendanceSummaryJourney).toStrictEqual({
          categoryFilters: [],
          reasonFilter: '',
          searchTerm: '',
          absenceReasonFilters: [],
          payFilters: [],
          activityTypeFilters: [],
        })
      })
    })
  })
})
