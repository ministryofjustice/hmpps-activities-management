import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { AllAttendance, ScheduledActivity } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import SuspendedPrisonersRoutes from './suspendedPrisoners'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Suspended prisoners list', () => {
  const handler = new SuspendedPrisonersRoutes(activitiesService, prisonService)

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
    const mockAttendanceResponse = [
      {
        attendanceId: 1,
        prisonCode: 'MDI',
        sessionDate: '2022-10-10',
        timeSlot: 'AM',
        status: 'COMPLETED',
        attendanceReasonCode: 'SUSPENDED',
        issuePayment: false,
        prisonerNumber: 'ABC123',
        scheduledInstanceId: 1,
        activitySummary: 'Maths Level 1',
        categoryName: 'Education',
      },
      {
        attendanceId: 2,
        prisonCode: 'MDI',
        sessionDate: '2022-10-10',
        timeSlot: 'AM',
        status: 'COMPLETED',
        attendanceReasonCode: 'AUTO_SUSPENDED',
        issuePayment: false,
        prisonerNumber: 'ABC123',
        scheduledInstanceId: 2,
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
        scheduledInstanceId: 2,
        activitySummary: 'Woodworking',
        categoryName: 'Prison Jobs',
      },
    ] as AllAttendance[]
    const mockActivitiesResponse = [
      {
        id: 1,
        startTime: '10:00',
        endTime: '11:00',
        activitySchedule: {
          activity: {
            summary: 'Maths level 1',
            category: { code: 'SAA_EDUCATION' },
            inCell: false,
            offWing: false,
            allocated: 4,
          },
          description: 'Houseblock 1',
          internalLocation: { description: 'Classroom' },
        },
        cancelled: true,
        allocated: 4,
        comment: 'Stuff training',
        cancelledReason: 'Teacher unavailable',
        attendances: [],
      },
      {
        id: 2,
        startTime: '13:00',
        endTime: '14:00',
        activitySchedule: {
          activity: {
            summary: 'Packing',
            category: { code: 'SAA_INDUSTRIES' },
            inCell: false,
            offWing: false,
            allocated: 4,
          },
          description: 'Houseblock 2',
          internalLocation: { description: 'Classroom 2' },
        },
        cancelled: false,
        allocated: 4,
        comment: 'Stuff Training',
        cancelledReason: 'Teacher unavailable',
        attendances: [],
      },
      {
        id: 3,
        startTime: '13:00',
        endTime: '14:00',
        activitySchedule: {
          activity: {
            summary: 'Packing',
            category: { code: 'SAA_INDUSTRIES' },
            inCell: false,
            offWing: false,
            allocated: 4,
          },
          description: 'Houseblock 2',
          internalLocation: { description: 'Classroom 2' },
        },
        cancelled: true,
        comment: 'Stuff training',
        cancelledReason: 'Teacher unavailable',
        attendances: [],
      },
    ] as ScheduledActivity[]
    const mockPrisonApiResponse = [
      {
        prisonerNumber: 'ABC123',
        firstName: 'Joe',
        lastName: 'Bloggs',
        cellLocation: 'MDI-1-001',
        alerts: [{ alertCode: 'HA' }, { alertCode: 'XCU' }],
        category: 'A',
      },
    ] as Prisoner[]

    it('should redirect to the select period page if date is not provided', async () => {
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })

    it('should render with the expected suspended prisoners view', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      req = {
        query: {
          date: dateString,
        },
        session: {},
      } as unknown as Request

      when(activitiesService.getAllAttendance)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockAttendanceResponse)
      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockActivitiesResponse)
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/suspended-prisoners', {
        activityDate: date,
        uniqueCategories: ['Education', 'Prison Jobs'],
        suspendedAttendancesByPrisoner: [
          {
            cellLocation: 'MDI-1-001',
            prisonerName: 'Joe Bloggs',
            prisonerNumber: 'ABC123',
            reason: 'Temporarily released or transferred',
            sessions: [
              {
                sessionEndTime: '11:00',
                sessionId: 1,
                sessionLocation: 'Classroom',
                sessionSlot: 'AM',
                sessionStartTime: '10:00',
                sessionSummary: 'Maths Level 1',
              },
              {
                sessionEndTime: '14:00',
                sessionId: 2,
                sessionLocation: 'Classroom 2',
                sessionSlot: 'AM',
                sessionStartTime: '13:00',
                sessionSummary: 'Woodworking',
              },
            ],
            timeSlots: ['AM', 'AM'],
          },
        ],
      })
    })

    it('should filter the activities based on the category', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      req = {
        query: {
          date: dateString,
        },
        session: {
          attendanceSummaryJourney: { categoryFilters: ['Education'] },
        },
      } as unknown as Request

      when(activitiesService.getAllAttendance)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockAttendanceResponse)
      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockActivitiesResponse)
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/suspended-prisoners', {
        activityDate: date,
        uniqueCategories: ['Education', 'Prison Jobs'],
        suspendedAttendancesByPrisoner: [
          {
            cellLocation: 'MDI-1-001',
            prisonerName: 'Joe Bloggs',
            prisonerNumber: 'ABC123',
            reason: 'Suspended',
            sessions: [
              {
                sessionEndTime: '11:00',
                sessionId: 1,
                sessionLocation: 'Classroom',
                sessionSlot: 'AM',
                sessionStartTime: '10:00',
                sessionSummary: 'Maths Level 1',
              },
            ],
            timeSlots: ['AM'],
          },
        ],
      })
    })

    it('should filter the activities based on the reason', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      req = {
        query: {
          date: dateString,
        },
        session: {
          attendanceSummaryJourney: { reasonFilter: 'AUTO_SUSPENDED' },
        },
      } as unknown as Request

      when(activitiesService.getAllAttendance)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockAttendanceResponse)
      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockActivitiesResponse)
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/suspended-prisoners', {
        activityDate: date,
        uniqueCategories: ['Education', 'Prison Jobs'],
        suspendedAttendancesByPrisoner: [
          {
            cellLocation: 'MDI-1-001',
            prisonerName: 'Joe Bloggs',
            prisonerNumber: 'ABC123',
            reason: 'Temporarily released or transferred',
            sessions: [
              {
                sessionEndTime: '14:00',
                sessionId: 2,
                sessionLocation: 'Classroom 2',
                sessionSlot: 'AM',
                sessionStartTime: '13:00',
                sessionSummary: 'Woodworking',
              },
            ],
            timeSlots: ['AM'],
          },
        ],
      })
    })
  })
})
