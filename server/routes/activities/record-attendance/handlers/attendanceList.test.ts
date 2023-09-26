import { Request, Response } from 'express'
import { when } from 'jest-when'
import { addDays, format, startOfYesterday } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { Allocation, PrisonerScheduledEvents, ScheduledActivity } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import AttendanceListRoutes, { ScheduledInstanceAttendance } from './attendanceList'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { getAttendanceSummary } from '../../../../utils/utils'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/MetricsEvent'
import AttendanceReason from '../../../../enum/attendanceReason'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/metricsService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)
const metricsService = new MetricsService(null)

describe('Route Handlers - Attendance List', () => {
  const handler = new AttendanceListRoutes(activitiesService, prisonService, metricsService)

  let req: Request
  let res: Response

  const prisoners = [
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
    {
      prisonerNumber: 'ZXY123',
      firstName: 'Mr',
      lastName: 'Blobby',
      cellLocation: 'MDI-1-003',
      alerts: [],
      category: 'A',
    },
  ] as Prisoner[]

  const event1 = {
    scheduledInstanceId: 1,
    eventType: 'ACTIVITY',
    eventSource: 'SAA',
    summary: 'Maths',
    startTime: '10:00',
    endTime: '11:00',
    prisonerNumber: 'ABC123',
  }

  const event2 = {
    appointmentSeriesId: 2,
    appointmentId: 2,
    appointmentAttendeeId: 2,
    eventType: 'APPOINTMENT',
    eventSource: 'SAA',
    summary: 'Appointment with the guv',
    startTime: '15:00',
    endTime: '16:00',
    prisonerNumber: 'ABC123',
  }

  const event3 = {
    eventId: 3,
    eventType: 'COURT_HEARING',
    eventSource: 'NOMIS',
    summary: 'Court hearing',
    startTime: '10:30',
    endTime: '11:00',
    prisonerNumber: 'ABC321',
  }

  const event4 = {
    eventId: 4,
    eventType: 'VISIT',
    eventSource: 'NOMIS',
    summary: 'Visit',
    startTime: '10:30',
    endTime: '11:00',
    prisonerNumber: 'ABC123',
  }

  const scheduledEvents = {
    activities: [event1],
    appointments: [event2],
    courtHearings: [event3],
    visits: [event4],
  } as PrisonerScheduledEvents

  const instance = {
    id: 1,
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '11:00',
    activitySchedule: {
      id: 2,
      activity: {
        summary: 'Maths level 1',
        inCell: false,
      },
      internalLocation: { description: 'Houseblock 1' },
    },
    attendances: [
      { id: 1, prisonerNumber: 'ABC123', status: 'WAITING' },
      { id: 2, prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
      { id: 3, prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
    ],
  } as unknown as ScheduledActivity

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirectWithSuccess: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: { id: 1 },
      session: {
        notAttendedJourney: {},
      },
      body: {},
    } as unknown as Request

    when(activitiesService.getScheduledActivity).calledWith(1, res.locals.user).mockResolvedValue(instance)

    when(activitiesService.getScheduledEventsForPrisoners)
      .calledWith(expect.any(Date), ['ABC123', 'ABC321', 'ZXY123'], res.locals.user)
      .mockResolvedValue(scheduledEvents)

    when(prisonService.searchInmatesByPrisonerNumbers)
      .calledWith(['ABC123', 'ABC321', 'ZXY123'], res.locals.user)
      .mockResolvedValue(prisoners)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    const attendance = [
      {
        prisoner: {
          ...prisoners[0],
          alerts: [{ alertCode: 'HA' }],
        },
        attendance: { id: 1, prisonerNumber: 'ABC123', status: 'WAITING' },
        otherEvents: [event4],
      },
      {
        prisoner: prisoners[1],
        attendance: { id: 2, prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
        otherEvents: [event3],
      },
      {
        prisoner: prisoners[2],
        attendance: { id: 3, prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
        otherEvents: [],
      },
    ] as unknown as ScheduledInstanceAttendance[]

    it('should render with the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attendance-list', {
        instance: {
          ...instance,
          isAmendable: true,
        },
        attendance,
        attendanceSummary: getAttendanceSummary(instance.attendances),
      })
    })

    it("shouldn't be amendable if session is in the past", async () => {
      const activityDate = format(startOfYesterday(), 'yyyy-MM-dd')

      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          ...instance,
          date: activityDate,
        } as ScheduledActivity)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attendance-list', {
        instance: {
          ...instance,
          isAmendable: false,
          date: activityDate,
        },
        attendance,
        attendanceSummary: getAttendanceSummary(instance.attendances),
      })
    })

    it('should pull a list of allocations for the session if session is in the future', async () => {
      const instanceWithoutAttendance = {
        ...instance,
        date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        attendances: [],
      } as ScheduledActivity

      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue(instanceWithoutAttendance)

      when(activitiesService.getAllocationsWithParams)
        .calledWith(2, { date: instanceWithoutAttendance.date }, res.locals.user)
        .mockResolvedValue([
          {
            id: 9,
            prisonerNumber: 'ABC123',
          },
          {
            id: 10,
            prisonerNumber: 'ABC321',
          },
          {
            id: 11,
            prisonerNumber: 'ZXY123',
          },
        ] as Allocation[])

      await handler.GET(req, res)

      const attendanceList = [
        {
          prisoner: {
            ...prisoners[0],
            alerts: [{ alertCode: 'HA' }],
          },
          attendance: undefined,
          otherEvents: [event4],
        },
        {
          prisoner: prisoners[1],
          attendance: undefined,
          otherEvents: [event3],
        },
        {
          prisoner: prisoners[2],
          attendance: undefined,
          otherEvents: [],
        },
      ] as unknown as ScheduledInstanceAttendance[]

      expect(res.render).toBeCalledWith('pages/activities/record-attendance/attendance-list', {
        instance: {
          ...instanceWithoutAttendance,
          isAmendable: true,
        },
        attendance: attendanceList,
        attendanceSummary: getAttendanceSummary(instanceWithoutAttendance.attendances),
      })
    })
  })

  describe('ATTENDED', () => {
    it('should update attendance then redirect to the attendance list page', async () => {
      req.body = {
        selectedAttendances: ['1', '2'],
      }

      await handler.ATTENDED(req, res)

      expect(metricsService.trackEvent).toHaveBeenCalledTimes(2)
      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.ATTENDANCE_RECORDED(instance, 'ABC123', AttendanceReason.ATTENDED, res.locals.user),
      )
      expect(activitiesService.updateAttendances).toBeCalledWith(
        [
          {
            id: 1,
            status: 'COMPLETED',
            attendanceReason: 'ATTENDED',
            issuePayment: true,
          },
          {
            id: 2,
            status: 'COMPLETED',
            attendanceReason: 'ATTENDED',
            issuePayment: true,
          },
        ],
        { username: 'joebloggs' },
      )

      expect(res.redirectWithSuccess).toBeCalledWith(
        'attendance-list',
        'Attendance recorded',
        "We've saved attendance details for 2 people",
      )
    })

    it('non attendance should be redirected to the non attendance page', async () => {
      req = {
        params: { id: 1 },
        session: {
          notAttendedJourney: {},
        },
        body: {
          selectedAttendances: ['1-ABC123'],
        },
      } as unknown as Request

      when(activitiesService.getScheduledEventsForPrisoners)
        .calledWith(expect.any(Date), ['ABC123'], res.locals.user)
        .mockResolvedValue({
          activities: [],
          appointments: [],
          courtHearings: [],
          visits: [],
        } as PrisonerScheduledEvents)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123'], res.locals.user)
        .mockResolvedValue([
          {
            prisonerNumber: 'ABC123',
            firstName: 'Joe',
            lastName: 'Bloggs',
            cellLocation: 'MDI-1-001',
            alerts: [],
            category: 'A',
          },
        ] as Prisoner[])

      await handler.NOT_ATTENDED(req, res)

      expect(res.redirect).toBeCalledWith('/activities/attendance/activities/1/not-attended-reason')
    })
  })
})
