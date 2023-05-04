import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import DailySummaryRoutes from './dailySummary'
import ActivitiesService from '../../../services/activitiesService'
import { AllAttendanceSummary, ScheduledActivity } from '../../../@types/activitiesAPI/types'
import { formatDate, toDate } from '../../../utils/utils'
import { AttendanceSummaryFilters, FilterItem } from '../../../@types/activities'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Daily Attendance Summary', () => {
  const handler = new DailySummaryRoutes(activitiesService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      session: {
        attendanceSummaryFilters: {
          categoryFilters: ['Education'],
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    const mockApiResponse = [
      {
        id: 1,
        prisonCode: 'MDI',
        activityId: 1,
        categoryName: 'Education',
        sessionDate: '2022-10-10',
        timeSlot: 'AM',
        status: 'WAITING',
        attendanceReasonCode: null,
        issuePayment: null,
        attendanceCount: 3,
      },
      {
        id: 6,
        prisonCode: 'MDI',
        activityId: 1,
        categoryName: 'Education',
        sessionDate: '2022-10-10',
        timeSlot: 'ED',
        status: 'WAITING',
        attendanceReasonCode: null,
        issuePayment: null,
        attendanceCount: 1,
      },
    ] as AllAttendanceSummary[]

    const mockActivities = [
      {
        id: 1,
        startTime: '10:00',
        endTime: '11:00',
        activitySchedule: {
          activity: { summary: 'Maths level 1', category: { code: 'Maths' } },
          description: 'Houseblock 1',
          internalLocation: { description: 'Classroom' },
        },
        cancelled: false,
        attendances: [
          { status: 'WAITING' },
          { status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
          { status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
        ],
      },
      {
        id: 2,
        startTime: '13:00',
        endTime: '14:00',
        activitySchedule: {
          activity: { summary: 'English level 1', category: { code: 'English' } },
          description: 'Houseblock 2',
          internalLocation: { description: 'Classroom 2' },
        },
        cancelled: false,
        attendances: [
          { status: 'WAITING' },
          { status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
          { status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
        ],
      },
    ] as ScheduledActivity[]

    it('should redirect to the select period page if date is not provided', async () => {
      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })

    it('should render with the expected view', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      req = {
        query: { date: dateString },
        session: {},
      } as unknown as Request

      when(await activitiesService.getAllAttendanceSummary)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      when(await activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockActivities)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/daily-attendance-summary/daily-summary', {
        activityDate: date,
        totalAbsences: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalActivities: {
          AM: 1,
          DAY: 1,
          ED: 1,
          PM: 0,
        },
        totalAllocated: {
          AM: 3,
          DAY: 4,
          ED: 1,
          PM: 0,
        },
        totalAttended: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalCancelled: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalClash: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalNotAttended: {
          AM: 3,
          DAY: 4,
          ED: 1,
          PM: 0,
        },
        totalNotRequired: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalPaidAbsences: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalPaidOther: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalPaidRest: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalPaidSick: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalRefused: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalUnPaidAbsences: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalUnpaidOther: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalUnpaidRest: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalUnpaidSick: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalStaffUnavailable: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalStaffTraining: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalLocationUnavailable: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalOperationalIssue: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        attendanceSummaryFilters: {
          activityDate: date,
          categoryFilters: [
            { value: 'ALL', text: 'All Categories', checked: true },
            { value: 'Education', text: 'Education', checked: false },
          ],
        },
      })
    })

    it('should filter the activities based on the category', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getAllAttendanceSummary)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      req = {
        query: { date: dateString },
        session: {
          attendanceSummaryFilters: {
            categories: ['Education'],
            categoryFilters: [{ value: 'Education', text: 'Education', checked: true }],
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/daily-attendance-summary/daily-summary', {
        activityDate: date,
        totalAbsences: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalActivities: {
          AM: 1,
          DAY: 1,
          ED: 1,
          PM: 0,
        },
        totalAllocated: {
          AM: 3,
          DAY: 4,
          ED: 1,
          PM: 0,
        },
        totalAttended: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalCancelled: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalClash: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalNotAttended: {
          AM: 3,
          DAY: 4,
          ED: 1,
          PM: 0,
        },
        totalNotRequired: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalPaidAbsences: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalPaidOther: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalPaidRest: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalPaidSick: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalRefused: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalUnPaidAbsences: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalUnpaidOther: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalUnpaidRest: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalUnpaidSick: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalStaffUnavailable: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalStaffTraining: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalLocationUnavailable: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalOperationalIssue: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        attendanceSummaryFilters: {
          categories: ['Education'],
          categoryFilters: [{ value: 'Education', text: 'Education', checked: true }],
        },
      })
    })
  })

  describe('POST', () => {
    it('should update category filter to Education', async () => {
      req = {
        query: {
          date: '2022-10-10',
        },
        body: {
          categoryFilters: ['Education'],
        },
        session: {
          attendanceSummaryFilters: testAttendanceSummaryFilters(),
        },
      } as unknown as Request

      await handler.POST(req, res)

      const { attendanceSummaryFilters } = req.session

      // Different from default filter values
      expect(
        attendanceSummaryFilters.categoryFilters.includes({ value: 'Education', text: 'Education', checked: true }),
      )

      expect(res.redirect).toHaveBeenCalledWith(
        `summary?date=${formatDate(attendanceSummaryFilters.activityDate, 'yyyy-MM-dd')}`,
      )
    })
  })

  describe('FILTERS', () => {
    it('should update category filter to All', async () => {
      req = {
        query: {
          date: '2022-10-10',
        },
        body: {
          categoryFilters: ['Education'],
        },
        session: {
          attendanceSummaryFilters: testAttendanceSummaryFilters(),
        },
      } as unknown as Request

      await handler.FILTERS(req, res)

      const { attendanceSummaryFilters } = req.session

      // Different from default filter values
      expect(
        attendanceSummaryFilters.categoryFilters.includes({ value: 'Education', text: 'Education', checked: true }),
      )

      expect(res.redirect).toHaveBeenCalledWith(
        `summary?date=${formatDate(attendanceSummaryFilters.activityDate, 'yyyy-MM-dd')}`,
      )
    })

    it('Clear a category filter', async () => {
      req = {
        query: { clearCategory: 'Education' },
        session: { attendanceSummaryFilters: testAttendanceSummaryFilters() },
      } as unknown as Request

      await handler.FILTERS(req, res)

      const { attendanceSummaryFilters } = req.session

      expect(attendanceSummaryFilters).toBeDefined()
      // All is added back in whenever a radio option is cleared
      expect(
        attendanceSummaryFilters.categoryFilters
          .filter((cat: FilterItem) => cat.checked === true)
          .filter((cat: FilterItem) => cat.value === 'ALL'),
      ).toHaveLength(1)
      const { activityDate } = attendanceSummaryFilters
      expect(res.redirect).toHaveBeenCalledWith(`summary?date=${formatDate(activityDate, 'yyyy-MM-dd')}`)
    })
  })
})

const categoryFiltersDefault = [
  { value: 'ALL', text: 'All categories', checked: true },
  { value: 'Education', text: 'Education', checked: false },
] as FilterItem[]

const testAttendanceSummaryFilters = (
  categoryFilters: FilterItem[] = categoryFiltersDefault,
): AttendanceSummaryFilters => {
  return {
    activityDate: toDate('2022-10-10'),
    categoryFilters,
  } as AttendanceSummaryFilters
}
