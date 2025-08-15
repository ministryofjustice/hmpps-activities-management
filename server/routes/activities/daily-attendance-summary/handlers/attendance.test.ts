import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { AllAttendance } from '../../../../@types/activitiesAPI/types'
import DailyAttendanceRoutes from './attendance'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import EventTier from '../../../../enum/eventTiers'
import AttendanceReason from '../../../../enum/attendanceReason'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import { PayNoPay } from '../../../../@types/activities'
import TimeSlot from '../../../../enum/timeSlot'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
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
      journeyData: {
        attendanceSummaryJourney: {},
      },
    } as unknown as Request
  })

  const absenceReasons = [
    AttendanceReason.CANCELLED,
    AttendanceReason.SICK,
    AttendanceReason.NOT_REQUIRED,
    AttendanceReason.REST,
    AttendanceReason.CLASH,
    AttendanceReason.REFUSED,
    AttendanceReason.AUTO_SUSPENDED,
    AttendanceReason.SUSPENDED,
    AttendanceReason.OTHER,
  ]

  describe('GET', () => {
    let mockApiResponse: AllAttendance[]
    let mockPrisonApiResponse: Prisoner[]

    beforeEach(() => {
      mockApiResponse = [
        {
          attendanceId: 1,
          prisonCode: 'MDI',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          startTime: '09:15',
          endTime: '11:30',
          status: 'WAITING',
          attendanceReasonCode: null,
          issuePayment: null,
          prisonerNumber: 'ABC123',
          activityId: 1,
          activitySummary: 'Maths Level 1',
          categoryName: 'Education',
          attendanceRequired: true,
          eventTier: EventTier.FOUNDATION,
        },
        {
          attendanceId: 2,
          prisonCode: 'MDI',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          startTime: '09:00',
          endTime: '12:30',
          status: 'WAITING',
          attendanceReasonCode: null,
          issuePayment: null,
          prisonerNumber: 'ABC321',
          activityId: 2,
          activitySummary: 'Woodworking',
          categoryName: 'Prison Jobs',
          attendanceRequired: true,
          eventTier: EventTier.FOUNDATION,
        },
        {
          attendanceId: 3,
          prisonCode: 'MDI',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          startTime: '09:00',
          endTime: '12:30',
          status: 'COMPLETED',
          attendanceReasonCode: 'ATTENDED',
          issuePayment: true,
          prisonerNumber: 'ZXY123',
          activityId: 2,
          activitySummary: 'Woodworking',
          categoryName: 'Prison Jobs',
          attendanceRequired: true,
          eventTier: EventTier.TIER_1,
        },
      ] as AllAttendance[]

      mockPrisonApiResponse = [
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
    })

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
        journeyData: {},
      } as unknown as Request

      when(activitiesService.getAllAttendance)
        .calledWith(date, res.locals.user, undefined)
        .mockResolvedValue(mockApiResponse)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123', 'ABC321'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/attendances', {
        activityDate: date,
        status: 'NotAttended',
        uniqueCategories: ['Education', 'Prison Jobs'],
        absenceReasons,
        showRefusalsLink: false,
        attendees: [
          {
            firstName: 'Joe',
            lastName: 'Bloggs',
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
              attendanceRequired: true,
              eventTier: EventTier.FOUNDATION,
              startTime: '09:15',
              endTime: '11:30',
            },
          },
          {
            firstName: 'Alan',
            lastName: 'Key',
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
              attendanceRequired: true,
              eventTier: EventTier.FOUNDATION,
              startTime: '09:00',
              endTime: '12:30',
            },
          },
        ],
      })
    })

    it('should filter by name', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      req = {
        query: {
          date: dateString,
          status: 'NotAttended',
        },
        journeyData: {
          attendanceSummaryJourney: {
            searchTerm: 'BloG',
          },
        },
      } as unknown as Request

      when(activitiesService.getAllAttendance)
        .calledWith(date, res.locals.user, undefined)
        .mockResolvedValue(mockApiResponse)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123', 'ABC321'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/attendances', {
        activityDate: date,
        status: 'NotAttended',
        uniqueCategories: ['Education', 'Prison Jobs'],
        absenceReasons,
        showRefusalsLink: false,
        attendees: [
          {
            firstName: 'Joe',
            lastName: 'Bloggs',
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
              attendanceRequired: true,
              eventTier: EventTier.FOUNDATION,
              startTime: '09:15',
              endTime: '11:30',
            },
          },
        ],
      })
    })

    it('should not render where attendance is not required', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      req = {
        query: {
          date: dateString,
          status: 'NotAttended',
        },
        journeyData: {},
      } as unknown as Request

      mockApiResponse[1].attendanceRequired = false
      mockPrisonApiResponse.pop()

      when(activitiesService.getAllAttendance)
        .calledWith(date, res.locals.user, undefined)
        .mockResolvedValue(mockApiResponse)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/attendances', {
        activityDate: date,
        status: 'NotAttended',
        uniqueCategories: ['Education'],
        absenceReasons,
        showRefusalsLink: false,
        attendees: [
          {
            firstName: 'Joe',
            lastName: 'Bloggs',
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
              attendanceRequired: true,
              eventTier: EventTier.FOUNDATION,
              startTime: '09:15',
              endTime: '11:30',
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
        journeyData: {},
      } as unknown as Request

      when(activitiesService.getAllAttendance)
        .calledWith(date, res.locals.user, undefined)
        .mockResolvedValue(mockApiResponse)

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
        absenceReasons,
        showRefusalsLink: false,
        attendees: [
          {
            firstName: 'Joe',
            lastName: 'Bloggs',
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
              attendanceRequired: true,
              eventTier: EventTier.TIER_1,
              startTime: '09:00',
              endTime: '12:30',
            },
          },
        ],
        uniqueCategories: ['Prison Jobs'],
      })
    })

    it('should filter the activities based on the category', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getAllAttendance)
        .calledWith(date, res.locals.user, undefined)
        .mockResolvedValue(mockApiResponse)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC321'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      req = {
        query: {
          date: dateString,
          status: 'NotAttended',
        },
        journeyData: {
          attendanceSummaryJourney: {
            categoryFilters: ['Prison Jobs'],
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/attendances', {
        activityDate: date,
        status: 'NotAttended',
        absenceReasons,
        showRefusalsLink: false,
        attendees: [
          {
            firstName: 'Alan',
            lastName: 'Key',
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
              attendanceRequired: true,
              eventTier: EventTier.FOUNDATION,
              startTime: '09:00',
              endTime: '12:30',
            },
          },
        ],
        uniqueCategories: ['Education', 'Prison Jobs'],
      })
    })

    it('should filter the activities based on the absence reason', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      const mockApiResponse2 = [
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
          attendanceRequired: true,
          eventTier: EventTier.FOUNDATION,
          startTime: '09:15',
          endTime: '11:30',
        },
        {
          activityId: 2,
          activitySummary: 'Woodworking',
          attendanceId: 2,
          attendanceReasonCode: AttendanceReason.CANCELLED,
          categoryName: 'Prison Jobs',
          issuePayment: false,
          prisonCode: 'MDI',
          prisonerNumber: 'ABC321',
          sessionDate: '2022-10-10',
          status: AttendanceStatus.COMPLETED,
          timeSlot: 'AM',
          attendanceRequired: true,
          eventTier: EventTier.FOUNDATION,
          startTime: '09:00',
          endTime: '12:30',
        },
        {
          attendanceId: 3,
          prisonCode: 'MDI',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.ATTENDED,
          issuePayment: true,
          prisonerNumber: 'ZXY123',
          activityId: 2,
          activitySummary: 'Woodworking',
          categoryName: 'Prison Jobs',
          attendanceRequired: true,
          eventTier: EventTier.TIER_1,
          startTime: '09:00',
          endTime: '12:30',
        },
        {
          attendanceId: 4,
          prisonCode: 'MDI',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.REFUSED,
          issuePayment: false,
          prisonerNumber: 'ABC123',
          activityId: 2,
          activitySummary: 'Woodworking',
          categoryName: 'Prison Jobs',
          attendanceRequired: true,
          eventTier: EventTier.TIER_1,
          startTime: '09:00',
          endTime: '12:30',
        },
      ] as AllAttendance[]

      when(activitiesService.getAllAttendance)
        .calledWith(date, res.locals.user, undefined)
        .mockResolvedValue(mockApiResponse2)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC321', 'ABC123'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      req = {
        query: {
          date: dateString,
          status: 'Absences',
        },
        journeyData: {
          attendanceSummaryJourney: {
            absenceReasonFilters: [AttendanceReason.CANCELLED, AttendanceReason.REFUSED],
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/attendances', {
        activityDate: date,
        status: 'Absences',
        absenceReasons,
        showRefusalsLink: true, // There is a refusal present, so we should show the link to the refusals page
        attendees: [
          {
            firstName: 'Alan',
            lastName: 'Key',
            prisonerNumber: 'ABC321',
            location: 'MDI-1-002',
            attendance: {
              activityId: 2,
              activitySummary: 'Woodworking',
              attendanceId: 2,
              attendanceReasonCode: AttendanceReason.CANCELLED,
              categoryName: 'Prison Jobs',
              issuePayment: false,
              prisonCode: 'MDI',
              prisonerNumber: 'ABC321',
              sessionDate: '2022-10-10',
              status: AttendanceStatus.COMPLETED,
              timeSlot: TimeSlot.AM,
              attendanceRequired: true,
              eventTier: EventTier.FOUNDATION,
              startTime: '09:00',
              endTime: '12:30',
            },
          },
          {
            firstName: 'Joe',
            lastName: 'Bloggs',
            location: 'MDI-1-001',
            prisonerNumber: 'ABC123',
            attendance: {
              activityId: 2,
              activitySummary: 'Woodworking',
              attendanceId: 4,
              attendanceReasonCode: AttendanceReason.REFUSED,
              attendanceRequired: true,
              categoryName: 'Prison Jobs',
              endTime: '12:30',
              eventTier: EventTier.TIER_1,
              issuePayment: false,
              prisonCode: 'MDI',
              prisonerNumber: 'ABC123',
              sessionDate: '2022-10-10',
              startTime: '09:00',
              status: AttendanceStatus.COMPLETED,
              timeSlot: TimeSlot.AM,
            },
          },
        ],
        uniqueCategories: ['Prison Jobs'],
      })
    })
    it('should filter the activities based on the pay arrangement', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      const mockApiResponse2 = [
        {
          activityId: 2,
          activitySummary: 'Woodworking',
          attendanceId: 2,
          attendanceReasonCode: AttendanceReason.CANCELLED,
          categoryName: 'Prison Jobs',
          issuePayment: false,
          prisonCode: 'MDI',
          prisonerNumber: 'ABC321',
          sessionDate: '2022-10-10',
          status: AttendanceStatus.COMPLETED,
          timeSlot: 'AM',
          attendanceRequired: true,
          eventTier: EventTier.FOUNDATION,
          startTime: '09:00',
          endTime: '12:30',
        },
        {
          attendanceId: 3,
          prisonCode: 'MDI',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.OTHER,
          issuePayment: true,
          prisonerNumber: 'ABC321',
          activityId: 2,
          activitySummary: 'Woodworking',
          categoryName: 'Prison Jobs',
          attendanceRequired: true,
          eventTier: EventTier.TIER_1,
          startTime: '09:00',
          endTime: '12:30',
        },
      ] as AllAttendance[]

      when(activitiesService.getAllAttendance)
        .calledWith(date, res.locals.user, undefined)
        .mockResolvedValue(mockApiResponse2)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC321'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      req = {
        query: {
          date: dateString,
          status: 'Absences',
        },
        journeyData: {
          attendanceSummaryJourney: {
            payFilters: PayNoPay.PAID,
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/attendances', {
        activityDate: date,
        status: 'Absences',
        absenceReasons,
        showRefusalsLink: false,
        attendees: [
          {
            firstName: 'Alan',
            lastName: 'Key',
            prisonerNumber: 'ABC321',
            location: 'MDI-1-002',
            attendance: {
              attendanceId: 3,
              prisonCode: 'MDI',
              sessionDate: '2022-10-10',
              timeSlot: 'AM',
              status: AttendanceStatus.COMPLETED,
              attendanceReasonCode: AttendanceReason.OTHER,
              issuePayment: true,
              prisonerNumber: 'ABC321',
              activityId: 2,
              activitySummary: 'Woodworking',
              categoryName: 'Prison Jobs',
              attendanceRequired: true,
              eventTier: EventTier.TIER_1,
              startTime: '09:00',
              endTime: '12:30',
            },
          },
        ],
        uniqueCategories: ['Prison Jobs'],
      })
    })
  })
})
