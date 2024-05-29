import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format, startOfYesterday, subDays } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import {
  PrisonerScheduledEvents,
  ScheduledActivity,
  ScheduledAttendee,
  ScheduledEvent,
} from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import AttendanceListRoutes, { ScheduledInstanceAttendance } from './attendanceList'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { getAttendanceSummary, toDateString } from '../../../../utils/utils'
import { AppointmentFrequency } from '../../../../@types/appointments'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Attendance List', () => {
  const handler = new AttendanceListRoutes(activitiesService, prisonService)

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

  const displayableCancelledAppointment: ScheduledEvent = {
    autoSuspended: false,
    cancelled: true,
    inCell: false,
    offWing: false,
    onWing: false,
    outsidePrison: false,
    priority: 0,
    suspended: false,
    appointmentSeriesId: 3,
    appointmentId: 3,
    appointmentAttendeeId: 2,
    eventType: 'APPOINTMENT',
    eventSource: 'SAA',
    summary: 'Appointment with the guv',
    startTime: '10:30',
    endTime: '11:00',
    prisonerNumber: 'ABC123',
    date: toDateString(subDays(new Date(), 2)),
    appointmentSeriesCancellationStartDate: toDateString(subDays(new Date(), 4)),
    appointmentSeriesFrequency: AppointmentFrequency.DAILY,
  }

  const appointmentDate = subDays(new Date(), 2)
  const threeDaysBefore = subDays(appointmentDate, 3)

  const expiredCancelledAppointment: ScheduledEvent = {
    autoSuspended: false,
    cancelled: true,
    inCell: false,
    offWing: false,
    onWing: false,
    outsidePrison: false,
    priority: 0,
    suspended: false,
    appointmentSeriesId: 3,
    appointmentId: 3,
    appointmentAttendeeId: 2,
    eventType: 'APPOINTMENT',
    eventSource: 'SAA',
    summary: 'Appointment with the guv',
    startTime: '10:30',
    endTime: '11:00',
    prisonerNumber: 'ABC123',
    date: toDateString(appointmentDate),
    appointmentSeriesCancellationStartDate: toDateString(threeDaysBefore),
    appointmentSeriesFrequency: AppointmentFrequency.DAILY,
  }

  const adjudicationsEvent = {
    eventId: 5,
    eventType: 'ADJUDICATION_HEARING',
    eventSource: 'NOMIS',
    summary: 'Adujication Hearing',
    startTime: '10:30',
    endTime: '11:00',
    prisonerNumber: 'ABC123',
  }

  const scheduledEvents = {
    activities: [event1],
    appointments: [event2, expiredCancelledAppointment, displayableCancelledAppointment],
    courtHearings: [event3],
    visits: [event4],
    adjudications: [adjudicationsEvent],
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
        paid: true,
      },
      internalLocation: { description: 'Houseblock 1' },
    },
    attendances: [
      { prisonerNumber: 'ABC123', status: 'WAITING' },
      { prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
      { prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
    ],
  } as unknown as ScheduledActivity

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'LEI',
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

    when(activitiesService.getAttendees)
      .calledWith(1, res.locals.user)
      .mockResolvedValue([
        { prisonerNumber: 'ABC123' },
        { prisonerNumber: 'ABC321' },
        { prisonerNumber: 'ZXY123' },
      ] as ScheduledAttendee[])

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
        attendance: { prisonerNumber: 'ABC123', status: 'WAITING' },
        otherEvents: [displayableCancelledAppointment, event4, adjudicationsEvent],
      },
      {
        prisoner: prisoners[1],
        attendance: { prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
        otherEvents: [event3],
      },
      {
        prisoner: prisoners[2],
        attendance: { prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
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
        isPayable: true,
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
        isPayable: true,
      })
    })
  })

  describe('ATTENDED', () => {
    it('should update attendance then redirect to the attendance list page', async () => {
      req.body = {
        selectedAttendances: ['1', '2'],
      }

      await handler.ATTENDED(req, res)

      expect(activitiesService.updateAttendances).toHaveBeenCalledWith(
        [
          {
            id: 1,
            status: 'COMPLETED',
            attendanceReason: 'ATTENDED',
            issuePayment: true,
            prisonCode: 'LEI',
          },
          {
            id: 2,
            status: 'COMPLETED',
            attendanceReason: 'ATTENDED',
            issuePayment: true,
            prisonCode: 'LEI',
          },
        ],
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'attendance-list',
        'Attendance recorded',
        "You've saved attendance details for 2 people",
      )
    })

    it('should not issue payment on unpaid activity', async () => {
      const noPayInstance = {
        ...instance,
        activitySchedule: {
          ...instance.activitySchedule,
          activity: {
            ...instance.activitySchedule.activity,
            paid: false,
          },
        },
      }
      when(activitiesService.getScheduledActivity).calledWith(1, res.locals.user).mockResolvedValue(noPayInstance)

      req.body = {
        selectedAttendances: ['1'],
      }

      await handler.ATTENDED(req, res)

      expect(activitiesService.updateAttendances).toHaveBeenCalledWith(
        [
          {
            id: 1,
            status: 'COMPLETED',
            attendanceReason: 'ATTENDED',
            issuePayment: false,
            prisonCode: 'LEI',
          },
        ],
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'attendance-list',
        'Attendance recorded',
        "You've saved attendance details for 1 person",
      )
    })
  })

  describe('NOT_ATTENDED', () => {
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
          adjudications: [],
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

      expect(res.redirect).toHaveBeenCalledWith('/activities/attendance/activities/1/not-attended-reason')
    })
  })
})
