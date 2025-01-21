import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format, parse, startOfToday, subDays } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import RefusedSessionsRoutes from './refusals'
import { AllAttendance } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import AttendanceReason from '../../../../enum/attendanceReason'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import TimeSlot from '../../../../enum/timeSlot'
import EventTier from '../../../../enum/eventTiers'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Refusals list', () => {
  const handler = new RefusedSessionsRoutes(activitiesService, prisonService)
  let req: Request
  let res: Response

  const yesterday = format(subDays(startOfToday(), 1), 'yyyy-MM-dd')

  beforeEach(() => {
    res = {
      locals: {
        username: 'joebloggs',
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = { session: {}, query: {} } as unknown as Request
  })
  describe('GET', () => {
    const mockApiResponse = [
      {
        attendanceId: 1319590,
        prisonCode: 'RSI',
        sessionDate: '2025-01-20',
        timeSlot: TimeSlot.AM,
        startTime: '08:30',
        endTime: '11:45',
        status: AttendanceStatus.COMPLETED,
        attendanceReasonCode: 'SUSPENDED',
        issuePayment: true,
        prisonerNumber: 'G8910VI',
        scheduledInstanceId: 211749,
        activityId: 477,
        activitySummary: 'A Wing Painter',
        categoryName: 'Prison jobs',
        recordedTime: '2025-01-20T07:15:11',
        attendanceRequired: true,
        eventTier: EventTier.TIER_1,
        incentiveLevelWarningIssued: null,
      },
      {
        attendanceId: 1319592,
        prisonCode: 'RSI',
        sessionDate: '2025-01-10',
        timeSlot: TimeSlot.AM,
        startTime: '08:30',
        endTime: '11:45',
        status: 'WAITING',
        attendanceReasonCode: null,
        issuePayment: null,
        prisonerNumber: 'ABC123',
        scheduledInstanceId: 211749,
        activityId: 477,
        activitySummary: 'A Wing Painter',
        categoryName: 'Prison jobs',
        recordedTime: null,
        attendanceRequired: true,
        eventTier: EventTier.TIER_1,
        incentiveLevelWarningIssued: null,
      },
      {
        attendanceId: 1319591,
        prisonCode: 'RSI',
        sessionDate: '2025-01-10',
        timeSlot: TimeSlot.AM,
        startTime: '08:30',
        endTime: '11:45',
        status: AttendanceStatus.COMPLETED,
        attendanceReasonCode: 'CLASH',
        issuePayment: true,
        prisonerNumber: 'ABC321',
        scheduledInstanceId: 211749,
        activityId: 477,
        activitySummary: 'A Wing Painter',
        categoryName: 'Prison jobs',
        recordedTime: '2025-01-20T13:07:00',
        attendanceRequired: true,
        eventTier: EventTier.TIER_1,
        incentiveLevelWarningIssued: false,
      },
      {
        attendanceId: 1320979,
        prisonCode: 'RSI',
        sessionDate: '2025-01-10',
        timeSlot: TimeSlot.AM,
        startTime: '08:30',
        endTime: '11:45',
        status: AttendanceStatus.COMPLETED,
        attendanceReasonCode: AttendanceReason.REFUSED,
        issuePayment: false,
        prisonerNumber: 'ABC123',
        scheduledInstanceId: 211924,
        activityId: 539,
        activitySummary: 'A Wing Cleaner 2',
        categoryName: 'Education',
        recordedTime: '2025-01-20T15:27:08',
        attendanceRequired: true,
        eventTier: EventTier.TIER_1,
        incentiveLevelWarningIssued: false,
      },
      {
        attendanceId: 1320981,
        prisonCode: 'RSI',
        sessionDate: '2025-01-10',
        timeSlot: TimeSlot.AM,
        startTime: '08:30',
        endTime: '11:45',
        status: AttendanceStatus.COMPLETED,
        attendanceReasonCode: AttendanceReason.REFUSED,
        issuePayment: false,
        prisonerNumber: 'ABC321',
        scheduledInstanceId: 211924,
        activityId: 539,
        activitySummary: 'A Wing Cleaner 2',
        categoryName: 'Education',
        recordedTime: '2025-01-20T15:26:49',
        attendanceRequired: true,
        eventTier: EventTier.TIER_1,
        incentiveLevelWarningIssued: true,
      },
    ] as AllAttendance[]
    const mockApiResponseYesterday = [
      {
        attendanceId: 1319591,
        prisonCode: 'RSI',
        sessionDate: yesterday,
        timeSlot: TimeSlot.AM,
        startTime: '08:30',
        endTime: '11:45',
        status: AttendanceStatus.COMPLETED,
        attendanceReasonCode: 'CLASH',
        issuePayment: true,
        prisonerNumber: 'ABC321',
        scheduledInstanceId: 211749,
        activityId: 477,
        activitySummary: 'A Wing Painter',
        categoryName: 'Prison jobs',
        recordedTime: '2025-01-20T13:07:00',
        attendanceRequired: true,
        eventTier: EventTier.TIER_1,
        incentiveLevelWarningIssued: false,
      },
      {
        attendanceId: 1320981,
        prisonCode: 'RSI',
        sessionDate: yesterday,
        timeSlot: TimeSlot.AM,
        startTime: '08:30',
        endTime: '11:45',
        status: AttendanceStatus.COMPLETED,
        attendanceReasonCode: AttendanceReason.REFUSED,
        issuePayment: false,
        prisonerNumber: 'ABC321',
        scheduledInstanceId: 211924,
        activityId: 539,
        activitySummary: 'A Wing Cleaner 2',
        categoryName: 'Education',
        recordedTime: '2025-01-20T15:26:49',
        attendanceRequired: true,
        eventTier: EventTier.TIER_1,
        incentiveLevelWarningIssued: true,
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
    it('redirects to select-period if no date is available in query', async () => {
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })
    it('Returns the correct records for activities in the past', async () => {
      const date = '2025-01-10'
      const parsedDate = parse('2025-01-10', 'yyyy-MM-dd', new Date())

      req = {
        query: {
          date,
        },
      } as unknown as Request

      when(activitiesService.getAllAttendance)
        .calledWith(parsedDate, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123', 'ABC321'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/refusals', {
        activityDate: parsedDate,
        refusedSessions: [
          {
            prisonerNumber: 'ABC123',
            firstName: 'Joe',
            lastName: 'Bloggs',
            location: 'MDI-1-001',
            editable: false,
            attendance: {
              attendanceId: 1320979,
              prisonCode: 'RSI',
              sessionDate: '2025-01-10',
              timeSlot: TimeSlot.AM,
              startTime: '08:30',
              endTime: '11:45',
              status: AttendanceStatus.COMPLETED,
              attendanceReasonCode: AttendanceReason.REFUSED,
              issuePayment: false,
              prisonerNumber: 'ABC123',
              scheduledInstanceId: 211924,
              activityId: 539,
              activitySummary: 'A Wing Cleaner 2',
              categoryName: 'Education',
              recordedTime: '2025-01-20T15:27:08',
              attendanceRequired: true,
              eventTier: EventTier.TIER_1,
              incentiveLevelWarningIssued: false,
            },
          },
          {
            prisonerNumber: 'ABC321',
            firstName: 'Alan',
            lastName: 'Key',
            location: 'MDI-1-002',
            editable: false,
            attendance: {
              attendanceId: 1320981,
              prisonCode: 'RSI',
              sessionDate: '2025-01-10',
              timeSlot: TimeSlot.AM,
              startTime: '08:30',
              endTime: '11:45',
              status: AttendanceStatus.COMPLETED,
              attendanceReasonCode: AttendanceReason.REFUSED,
              issuePayment: false,
              prisonerNumber: 'ABC321',
              scheduledInstanceId: 211924,
              activityId: 539,
              activitySummary: 'A Wing Cleaner 2',
              categoryName: 'Education',
              recordedTime: '2025-01-20T15:26:49',
              attendanceRequired: true,
              eventTier: EventTier.TIER_1,
              incentiveLevelWarningIssued: true,
            },
          },
        ],
      })
    })
    it('Returns correctly if there are no refusals', async () => {
      const date = '2025-01-10'
      const parsedDate = parse('2025-01-10', 'yyyy-MM-dd', new Date())

      req = {
        query: {
          date,
        },
      } as unknown as Request

      when(activitiesService.getAllAttendance).calledWith(parsedDate, res.locals.user).mockResolvedValue([])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/refusals', {
        activityDate: parsedDate,
        refusedSessions: [],
      })
    })
    it('Returns the correct records for recent activities', async () => {
      const parsedDate = parse(yesterday, 'yyyy-MM-dd', new Date())

      req = {
        query: {
          date: yesterday,
        },
      } as unknown as Request

      when(activitiesService.getAllAttendance)
        .calledWith(parsedDate, res.locals.user)
        .mockResolvedValue(mockApiResponseYesterday)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC321'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/refusals', {
        activityDate: parsedDate,
        refusedSessions: [
          {
            prisonerNumber: 'ABC321',
            firstName: 'Alan',
            lastName: 'Key',
            location: 'MDI-1-002',
            editable: true,
            attendance: {
              attendanceId: 1320981,
              prisonCode: 'RSI',
              sessionDate: yesterday,
              timeSlot: TimeSlot.AM,
              startTime: '08:30',
              endTime: '11:45',
              status: AttendanceStatus.COMPLETED,
              attendanceReasonCode: AttendanceReason.REFUSED,
              issuePayment: false,
              prisonerNumber: 'ABC321',
              scheduledInstanceId: 211924,
              activityId: 539,
              activitySummary: 'A Wing Cleaner 2',
              categoryName: 'Education',
              recordedTime: '2025-01-20T15:26:49',
              attendanceRequired: true,
              eventTier: EventTier.TIER_1,
              incentiveLevelWarningIssued: true,
            },
          },
        ],
      })
    })
  })
})
