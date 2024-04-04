import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import DailySummaryRoutes from './dailySummary'
import ActivitiesService from '../../../../services/activitiesService'
import { AllAttendance, ScheduledActivity } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

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
    const mockAllAttendanceApiResponse = [
      {
        attendanceId: 1,
        scheduledInstanceId: 1,
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
      },
      {
        attendanceId: 2,
        scheduledInstanceId: 2,
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
        attendanceRequired: true,
      },
      {
        attendanceId: 3,
        scheduledInstanceId: 2,
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
        attendanceRequired: true,
      },
      {
        attendanceId: 4,
        scheduledInstanceId: 2,
        prisonCode: 'MDI',
        sessionDate: '2022-10-10',
        timeSlot: 'AM',
        status: 'COMPLETED',
        attendanceReasonCode: 'SUSPENDED',
        issuePayment: false,
        prisonerNumber: 'ZXY321',
        activityId: 2,
        activitySummary: 'Woodworking',
        categoryName: 'Prison Jobs',
        attendanceRequired: true,
      },
      {
        attendanceId: 5,
        scheduledInstanceId: 2,
        prisonCode: 'MDI',
        sessionDate: '2022-10-10',
        timeSlot: 'AM',
        status: 'COMPLETED',
        attendanceReasonCode: 'AUTO_SUSPENDED',
        issuePayment: false,
        prisonerNumber: 'ZXY432',
        activityId: 2,
        activitySummary: 'Woodworking',
        categoryName: 'Prison Jobs',
        attendanceRequired: true,
      },
      {
        attendanceId: 6,
        scheduledInstanceId: 3,
        prisonCode: 'MDI',
        sessionDate: '2022-10-10',
        timeSlot: 'AM',
        status: 'WAITING',
        issuePayment: false,
        prisonerNumber: 'ZXY432',
        activityId: 3,
        activitySummary: 'Gym',
        categoryName: 'Exercise',
        attendanceRequired: false,
      },
      {
        attendanceId: 7,
        scheduledInstanceId: 4,
        prisonCode: 'MDI',
        sessionDate: '2022-10-10',
        timeSlot: 'PM',
        status: 'WAITING',
        issuePayment: false,
        prisonerNumber: 'ZXY432',
        activityId: 4,
        activitySummary: 'Maths',
        categoryName: 'Education',
        attendanceRequired: false,
      },
    ] as AllAttendance[]

    const mockCancelledActivities = [
      {
        id: 1,
        startTime: '10:00',
        endTime: '11:00',
        activitySchedule: {
          activity: { id: 2, summary: 'Woodworking', category: { name: 'Prison Jobs' } },
          description: 'Houseblock 1',
          internalLocation: { description: 'Workshop' },
        },
        cancelled: true,
      },
      {
        id: 2,
        startTime: '10:00',
        endTime: '11:00',
        activitySchedule: {
          activity: { id: 3, summary: 'Gym', category: { name: 'Exercise' } },
          description: 'Houseblock 1',
          internalLocation: { description: 'Workshop' },
        },
        cancelled: true,
      },
      {
        id: 3,
        startTime: '13:00',
        endTime: '14:00',
        activitySchedule: {
          activity: { id: 4, summary: 'Maths', category: { name: 'Education' } },
          description: 'Houseblock 1',
          internalLocation: { description: 'Workshop' },
        },
        cancelled: true,
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

      when(activitiesService.getAllAttendance)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockAllAttendanceApiResponse)

      when(activitiesService.getCancelledScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockCancelledActivities)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/daily-summary', {
        activityDate: date,
        uniqueCategories: ['Education', 'Prison Jobs', 'Exercise'],
        totalAbsences: {
          AM: 2,
          DAY: 2,
          ED: 0,
          PM: 0,
        },
        totalActivities: {
          AM: 2,
          DAY: 2,
          ED: 0,
          PM: 0,
        },
        totalAllocated: {
          AM: 5,
          DAY: 5,
          ED: 0,
          PM: 0,
        },
        totalAttended: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalCancelled: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalCancelledSessions: {
          AM: 1,
          DAY: 1,
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
          AM: 2,
          DAY: 2,
          ED: 0,
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
          AM: 2,
          DAY: 2,
          ED: 0,
          PM: 0,
        },
        totalUnpaidOther: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalUnpaidSuspended: {
          AM: 2,
          DAY: 2,
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
        totalActivityNotRequired: {
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
        suspendedPrisonerCount: {
          AM: 2,
          DAY: 2,
          ED: 0,
          PM: 0,
        },
        totalUnattendedActivities: {
          AM: 1,
          DAY: 2,
          ED: 0,
          PM: 1,
        },
        totalUnattendedAllocated: {
          AM: 1,
          DAY: 2,
          ED: 0,
          PM: 1,
        },
        totalUnattendedCancelledSessions: {
          AM: 1,
          DAY: 2,
          ED: 0,
          PM: 1,
        },
      })
    })

    it('should filter the activities based on the category', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getAllAttendance)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockAllAttendanceApiResponse)

      when(activitiesService.getCancelledScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockCancelledActivities)

      req = {
        query: { date: dateString },
        session: {
          attendanceSummaryJourney: {
            categoryFilters: ['Education'],
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/daily-summary', {
        activityDate: date,
        uniqueCategories: ['Education', 'Prison Jobs', 'Exercise'],
        totalAbsences: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalActivities: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalAllocated: {
          AM: 1,
          DAY: 1,
          ED: 0,
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
        totalCancelledSessions: {
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
          AM: 1,
          DAY: 1,
          ED: 0,
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
        totalUnpaidSuspended: {
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
        totalActivityNotRequired: {
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
        suspendedPrisonerCount: {
          AM: 0,
          DAY: 0,
          ED: 0,
          PM: 0,
        },
        totalUnattendedActivities: {
          AM: 0,
          DAY: 1,
          ED: 0,
          PM: 1,
        },
        totalUnattendedAllocated: {
          AM: 0,
          DAY: 1,
          ED: 0,
          PM: 1,
        },
        totalUnattendedCancelledSessions: {
          AM: 0,
          DAY: 1,
          ED: 0,
          PM: 1,
        },
      })
    })
  })
})
