import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { AllAttendance } from '../../../../@types/activitiesAPI/types'
import DailyAttendanceRoutes from './attendance'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

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
        attendanceSummaryJourney: {},
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
        activityId: 2,
        activitySummary: 'Woodworking',
        categoryName: 'Prison Jobs',
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
        activityId: 2,
        activitySummary: 'Woodworking',
        categoryName: 'Prison Jobs',
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

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/attendances', {
        activityDate: date,
        status: 'NotAttended',
        uniqueActivities: ['Maths Level 1', 'Woodworking'],
        uniqueCategories: ['Education', 'Prison Jobs'],
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
              activityId: 2,
              activitySummary: 'Woodworking',
              attendanceId: 2,
              attendanceReasonCode: null,
              categoryName: 'Prison Jobs',
              issuePayment: null,
              prisonCode: 'MDI',
              prisonerNumber: 'ABC321',
              sessionDate: '2022-10-10',
              status: 'WAITING',
              timeSlot: 'AM',
            },
          },
        ],
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

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/attendances', {
        activityDate: date,
        status: 'Attended',
        attendees: [
          {
            name: 'Joe Bloggs',
            prisonerNumber: 'ZXY123',
            location: 'MDI-1-001',
            attendance: {
              activityId: 2,
              activitySummary: 'Woodworking',
              attendanceId: 3,
              attendanceReasonCode: 'ATTENDED',
              categoryName: 'Prison Jobs',
              issuePayment: true,
              prisonCode: 'MDI',
              prisonerNumber: 'ZXY123',
              sessionDate: '2022-10-10',
              status: 'COMPLETED',
              timeSlot: 'AM',
            },
          },
        ],
        uniqueActivities: ['Woodworking'],
        uniqueCategories: ['Prison Jobs'],
      })
    })

    it('should filter the activities based on the category', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getAllAttendance).calledWith(date, res.locals.user).mockResolvedValue(mockApiResponse)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC321'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      req = {
        query: {
          date: dateString,
          status: 'NotAttended',
        },
        session: {
          attendanceSummaryJourney: {
            categoryFilters: ['Prison Jobs'],
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/attendances', {
        activityDate: date,
        status: 'NotAttended',
        attendees: [
          {
            name: 'Alan Key',
            prisonerNumber: 'ABC321',
            location: 'MDI-1-002',
            attendance: {
              activityId: 2,
              activitySummary: 'Woodworking',
              attendanceId: 2,
              attendanceReasonCode: null,
              categoryName: 'Prison Jobs',
              issuePayment: null,
              prisonCode: 'MDI',
              prisonerNumber: 'ABC321',
              sessionDate: '2022-10-10',
              status: 'WAITING',
              timeSlot: 'AM',
            },
          },
        ],
        uniqueActivities: ['Maths Level 1', 'Woodworking'],
        uniqueCategories: ['Education', 'Prison Jobs'],
      })
    })

    it('should filter the activities based on the category', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getAllAttendance).calledWith(date, res.locals.user).mockResolvedValue(mockApiResponse)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC321'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      req = {
        query: {
          date: dateString,
          status: 'NotAttended',
        },
        session: {
          attendanceSummaryJourney: {
            activityFilters: ['Woodworking'],
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/attendances', {
        activityDate: date,
        status: 'NotAttended',
        attendees: [
          {
            name: 'Alan Key',
            prisonerNumber: 'ABC321',
            location: 'MDI-1-002',
            attendance: {
              activityId: 2,
              activitySummary: 'Woodworking',
              attendanceId: 2,
              attendanceReasonCode: null,
              categoryName: 'Prison Jobs',
              issuePayment: null,
              prisonCode: 'MDI',
              prisonerNumber: 'ABC321',
              sessionDate: '2022-10-10',
              status: 'WAITING',
              timeSlot: 'AM',
            },
          },
        ],
        uniqueActivities: ['Maths Level 1', 'Woodworking'],
        uniqueCategories: ['Education', 'Prison Jobs'],
      })
    })
  })
})
