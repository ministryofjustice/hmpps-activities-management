import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import ActivitiesService from '../../../services/activitiesService'
import { AllAttendance } from '../../../@types/activitiesAPI/types'
import { formatDate, toDate } from '../../../utils/utils'
import { AttendanceSummaryFilters, FilterItem } from '../../../@types/activities'
import DailyAttendanceRoutes from './attendance'
import PrisonService from '../../../services/prisonService'
import { Prisoner } from '../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/prisonService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Daily Attendance List', () => {
  const handler = new DailyAttendanceRoutes(activitiesService, prisonService)

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
        attendanceId: 1,
        prisonCode: 'MDI',
        sessionDate: '2022-10-10',
        timeSlot: 'AM',
        status: 'WAITING',
        attendanceReasonCode: null,
        issuePayment: null,
        prisonerNumber: 'ABC123',
        activityId: 1,
        activitySummary: 'Maths Level 1',
        categoryName: 'Education',
      },
      {
        attendanceId: 2,
        prisonCode: 'MDI',
        sessionDate: '2022-10-10',
        timeSlot: 'AM',
        status: 'WAITING',
        attendanceReasonCode: null,
        issuePayment: null,
        prisonerNumber: 'ABC321',
        activityId: 1,
        activitySummary: 'Maths Level 1',
        categoryName: 'Education',
      },
      {
        attendanceId: 3,
        prisonCode: 'MDI',
        sessionDate: '2022-10-10',
        timeSlot: 'AM',
        status: 'COMPLETED',
        attendanceReasonCode: 'ATTENDED',
        issuePayment: true,
        prisonerNumber: 'ZXY123',
        activityId: 1,
        activitySummary: 'Maths Level 1',
        categoryName: 'Education',
      },
    ] as AllAttendance[]

    const mockPrisonApiResponse = [
      {
        prisonerNumber: 'ABC123',
        firstName: 'Joe',
        lastName: 'Bloggs',
        cellLocation: 'MDI-1-001',
        alerts: [{ alertCode: 'HA' }, { alertCode: 'XCU' }],
        category: 'A',
      },
      {
        prisonerNumber: 'ABC321',
        firstName: 'Alan',
        lastName: 'Key',
        cellLocation: 'MDI-1-002',
        alerts: [],
        category: 'A',
      },
    ] as Prisoner[]

    it('should redirect to the select period page if date is not provided', async () => {
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })

    it('should render with the expected not attended view', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      req = {
        query: {
          date: dateString,
          status: 'NotAttended',
        },
        session: {},
      } as unknown as Request

      when(activitiesService.getAllAttendance).calledWith(date, res.locals.user).mockResolvedValue(mockApiResponse)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123', 'ABC321'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/daily-attendance-summary/not-attended', {
        activityDate: date,
        status: 'NotAttended',
        attendees: [
          {
            name: 'Joe Bloggs',
            prisonerNumber: 'ABC123',
            location: 'MDI-1-001',
            attendance: {
              activityId: 1,
              activitySummary: 'Maths Level 1',
              attendanceId: 1,
              attendanceReasonCode: null,
              categoryName: 'Education',
              issuePayment: null,
              prisonCode: 'MDI',
              prisonerNumber: 'ABC123',
              sessionDate: '2022-10-10',
              status: 'WAITING',
              timeSlot: 'AM',
            },
          },
          {
            name: 'Alan Key',
            prisonerNumber: 'ABC321',
            location: 'MDI-1-002',
            attendance: {
              activityId: 1,
              activitySummary: 'Maths Level 1',
              attendanceId: 2,
              attendanceReasonCode: null,
              categoryName: 'Education',
              issuePayment: null,
              prisonCode: 'MDI',
              prisonerNumber: 'ABC321',
              sessionDate: '2022-10-10',
              status: 'WAITING',
              timeSlot: 'AM',
            },
          },
        ],
        attendanceSummaryFilters: {
          activityDate: date,
          categoryFilters: [{ value: 'Education', text: 'Education', checked: true }],
          activityFilters: [{ value: 'Maths Level 1', text: 'Maths Level 1', checked: true }],
          searchTerm: '',
        },
      })
    })

    it('should render with the expected attended view', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      req = {
        query: {
          date: dateString,
          status: 'Attended',
        },
        session: {},
      } as unknown as Request

      when(activitiesService.getAllAttendance).calledWith(date, res.locals.user).mockResolvedValue(mockApiResponse)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ZXY123'], res.locals.user)
        .mockResolvedValue([
          {
            prisonerNumber: 'ZXY123',
            firstName: 'Joe',
            lastName: 'Bloggs',
            cellLocation: 'MDI-1-001',
            alerts: [{ alertCode: 'HA' }, { alertCode: 'XCU' }],
            category: 'A',
          },
        ] as Prisoner[])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/daily-attendance-summary/attended', {
        activityDate: date,
        status: 'Attended',
        attendees: [
          {
            name: 'Joe Bloggs',
            prisonerNumber: 'ZXY123',
            location: 'MDI-1-001',
            attendance: {
              activityId: 1,
              activitySummary: 'Maths Level 1',
              attendanceId: 3,
              attendanceReasonCode: 'ATTENDED',
              categoryName: 'Education',
              issuePayment: true,
              prisonCode: 'MDI',
              prisonerNumber: 'ZXY123',
              sessionDate: '2022-10-10',
              status: 'COMPLETED',
              timeSlot: 'AM',
            },
          },
        ],
        attendanceSummaryFilters: {
          activityDate: date,
          categoryFilters: [{ value: 'Education', text: 'Education', checked: true }],
          activityFilters: [{ value: 'Maths Level 1', text: 'Maths Level 1', checked: true }],
          searchTerm: '',
        },
      })
    })

    it('should filter the activities based on the category', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getAllAttendance).calledWith(date, res.locals.user).mockResolvedValue(mockApiResponse)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ZXY123'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      req = {
        query: {
          date: dateString,
          status: 'NotAttended',
        },
        session: {
          attendanceSummaryFilters: {
            categories: ['Education'],
            categoryFilters: [{ value: 'Education', text: 'Education', checked: true }],
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/daily-attendance-summary/not-attended', {
        activityDate: date,
        status: 'NotAttended',
        attendees: [
          {
            name: 'Joe Bloggs',
            prisonerNumber: 'ABC123',
            location: 'MDI-1-001',
            attendance: {
              activityId: 1,
              activitySummary: 'Maths Level 1',
              attendanceId: 1,
              attendanceReasonCode: null,
              categoryName: 'Education',
              issuePayment: null,
              prisonCode: 'MDI',
              prisonerNumber: 'ABC123',
              sessionDate: '2022-10-10',
              status: 'WAITING',
              timeSlot: 'AM',
            },
          },
          {
            name: 'Alan Key',
            prisonerNumber: 'ABC321',
            location: 'MDI-1-002',
            attendance: {
              activityId: 1,
              activitySummary: 'Maths Level 1',
              attendanceId: 2,
              attendanceReasonCode: null,
              categoryName: 'Education',
              issuePayment: null,
              prisonCode: 'MDI',
              prisonerNumber: 'ABC321',
              sessionDate: '2022-10-10',
              status: 'WAITING',
              timeSlot: 'AM',
            },
          },
        ],
        attendanceSummaryFilters: {
          activityDate: date,
          categoryFilters: [{ value: 'Education', text: 'Education', checked: true }],
          activityFilters: [{ value: 'Maths Level 1', text: 'Maths Level 1', checked: true }],
          searchTerm: '',
        },
      })
    })
  })

  describe('POST', () => {
    it('should update category filter to Education', async () => {
      req = {
        query: {
          date: '2022-10-10',
          status: 'NotAttended',
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
        `attendance?date=${formatDate(attendanceSummaryFilters.activityDate, 'yyyy-MM-dd')}&status=NotAttended`,
      )
    })
  })

  describe('FILTERS', () => {
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

      await handler.FILTERS(req, res)

      const { attendanceSummaryFilters } = req.session

      // Different from default filter values
      expect(
        attendanceSummaryFilters.categoryFilters.includes({ value: 'Education', text: 'Education', checked: true }),
      )

      expect(res.redirect).toHaveBeenCalledWith(
        `attendance?date=${formatDate(attendanceSummaryFilters.activityDate, 'yyyy-MM-dd')}`,
      )
    })
  })
})

const categoryFiltersDefault = [{ value: 'Education', text: 'Education', checked: false }] as FilterItem[]

const activityFiltersDefault = [{ value: 'Maths Level 1', text: 'Maths Level 1', checked: false }] as FilterItem[]

const testAttendanceSummaryFilters = (
  categoryFilters: FilterItem[] = categoryFiltersDefault,
  activityFilters: FilterItem[] = activityFiltersDefault,
): AttendanceSummaryFilters => {
  return {
    activityDate: toDate('2022-10-10'),
    categoryFilters,
    activityFilters,
  } as AttendanceSummaryFilters
}
