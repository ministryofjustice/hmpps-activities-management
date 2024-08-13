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
import UserService from '../../../../services/userService'
import atLeast from '../../../../../jest.setup'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/userService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)
const userService = new UserService(null, null, null)

describe('Route Handlers - Attendance List', () => {
  const handler = new AttendanceListRoutes(activitiesService, prisonService, userService)
  const today = format(new Date(), 'yyyy-MM-dd')

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
    appointmentSeriesCancellationStartDate: toDateString(subDays(new Date(), 3)),
    appointmentSeriesFrequency: AppointmentFrequency.DAILY,
  }

  const appointmentDate = subDays(new Date(), 2)
  const twoDaysBefore = subDays(appointmentDate, 2)

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
    appointmentSeriesCancellationStartDate: toDateString(twoDaysBefore),
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

  const instanceA = {
    id: 1,
    date: today,
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
      { id: 1001, prisonerNumber: 'ABC123', status: 'WAITING' },
      { id: 1002, prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
      { id: 1003, prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
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
        recordAttendanceRequests: {},
      },
      body: {},
      query: {},
    } as unknown as Request

    when(activitiesService.getScheduledActivity).calledWith(1, res.locals.user).mockResolvedValue(instanceA)

    when(userService.getUserMap)
      .calledWith(atLeast([null]))
      .mockResolvedValue(new Map([]) as Map<string, UserDetails>)

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
        attendance: { id: 1001, prisonerNumber: 'ABC123', status: 'WAITING' },
        otherEvents: [displayableCancelledAppointment, event4, adjudicationsEvent],
      },
      {
        prisoner: prisoners[1],
        attendance: { id: 1002, prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
        otherEvents: [event3],
      },
      {
        prisoner: prisoners[2],
        attendance: { id: 1003, prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
        otherEvents: [],
      },
    ] as unknown as ScheduledInstanceAttendance[]

    it('should render with the expected view when there are no time sessions saved', async () => {
      await handler.GET(req, res)

      expect(req.session.recordAttendanceRequests.mode).toEqual(undefined)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attendance-list-single', {
        instance: {
          ...instanceA,
          isAmendable: true,
        },
        attendance,
        attendanceSummary: getAttendanceSummary(instanceA.attendances),
        isPayable: true,
        selectedSessions: [],
      })
    })

    it('should render with the expected view when there are time sessions saved', async () => {
      req.session.recordAttendanceRequests.sessionFilters = ['am', 'ed']

      await handler.GET(req, res)

      expect(req.session.recordAttendanceRequests.mode).toEqual(undefined)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attendance-list-single', {
        instance: {
          ...instanceA,
          isAmendable: true,
        },
        attendance,
        attendanceSummary: getAttendanceSummary(instanceA.attendances),
        isPayable: true,
        selectedSessions: ['AM', 'ED'],
      })
    })

    it("shouldn't be amendable if session is in the past", async () => {
      const activityDate = format(startOfYesterday(), 'yyyy-MM-dd')

      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          ...instanceA,
          date: activityDate,
        } as ScheduledActivity)

      await handler.GET(req, res)

      expect(req.session.recordAttendanceRequests.mode).toEqual(undefined)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attendance-list-single', {
        instance: {
          ...instanceA,
          isAmendable: false,
          date: activityDate,
        },
        attendance,
        attendanceSummary: getAttendanceSummary(instanceA.attendances),
        isPayable: true,
        selectedSessions: [],
      })
    })

    it('Should clear any session data when called in standalone mode', async () => {
      req.query.mode = 'standalone'
      req.session.recordAttendanceRequests.sessionFilters = ['AM', 'ED']

      await handler.GET(req, res)

      expect(req.session.recordAttendanceRequests).toEqual({})

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attendance-list-single', {
        instance: {
          ...instanceA,
          isAmendable: true,
        },
        attendance,
        attendanceSummary: getAttendanceSummary(instanceA.attendances),
        isPayable: true,
        selectedSessions: [],
      })
    })

    it('Should not clear session data', async () => {
      req.query.mode = 'unknown'
      req.session.recordAttendanceRequests.sessionFilters = ['AM']

      await handler.GET(req, res)

      expect(req.session.recordAttendanceRequests.sessionFilters).toEqual(['AM'])

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attendance-list-single', {
        instance: {
          ...instanceA,
          isAmendable: true,
        },
        attendance,
        attendanceSummary: getAttendanceSummary(instanceA.attendances),
        isPayable: true,
        selectedSessions: ['AM'],
      })
    })
  })

  describe('ATTENDED', () => {
    it('should update attendance then redirect to the attendance list page', async () => {
      req.body = {
        selectedAttendances: ['999-1', '999-2'],
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
        ...instanceA,
        activitySchedule: {
          ...instanceA.activitySchedule,
          activity: {
            ...instanceA.activitySchedule.activity,
            paid: false,
          },
        },
      }
      when(activitiesService.getScheduledActivity).calledWith(1, res.locals.user).mockResolvedValue(noPayInstance)

      req.body = {
        selectedAttendances: ['999-1'],
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

  describe('Attend multiple instances', () => {
    const instanceB = {
      id: 2,
      date: today,
      startTime: '13:00',
      endTime: '14:00',
      activitySchedule: {
        id: 2,
        activity: {
          summary: 'Maths level 2',
          inCell: false,
          paid: true,
        },
        internalLocation: { description: 'Houseblock 1' },
      },
      attendances: [
        { id: 2001, prisonerNumber: 'ABC123', status: 'WAITING' },
        { id: 2002, prisonerNumber: 'XYZ345', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
      ],
    } as unknown as ScheduledActivity

    const prisonersToAttend = [
      {
        prisonerNumber: 'ABC123',
        firstName: 'Joe',
        lastName: 'Bloggs',
      },
      {
        prisonerNumber: 'ABC321',
        firstName: 'Sally',
        lastName: 'Bowles',
      },
      {
        prisonerNumber: 'ZXY123',
        firstName: 'Steve',
        lastName: 'McQueen',
      },
      {
        prisonerNumber: 'XYZ345',
        firstName: 'Mary',
        lastName: 'Smith',
      },
    ]

    beforeEach(() => {
      req.session.recordAttendanceRequests = {
        selectedInstanceIds: ['1', '2'],
        sessionFilters: ['AM', 'PM'],
      }

      when(activitiesService.getScheduledActivity).calledWith(2, res.locals.user).mockResolvedValue(instanceB)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123', 'ABC321', 'ZXY123', 'XYZ345'], res.locals.user)
        .mockResolvedValue(prisonersToAttend as Prisoner[])

      when(activitiesService.getScheduledEventsForPrisoners)
        .calledWith(expect.any(Date), ['ABC123', 'ABC321', 'ZXY123', 'XYZ345'], res.locals.user)
        .mockResolvedValue({
          activities: [
            {
              prisonerNumber: 'ABC123',
              cancelled: true,
              scheduledInstanceId: 344,
              startTime: '09:00',
              endTime: '12:00',
            },
          ],
          appointments: [
            {
              prisonerNumber: 'ABC123',
              cancelled: false,
              scheduledInstanceId: null,
              startTime: '09:00',
              endTime: '12:00',
            },
          ],
          courtHearings: [
            {
              prisonerNumber: 'ABC123',
              cancelled: false,
              scheduledInstanceId: null,
              startTime: '14:00',
              endTime: '15:00',
            },
          ],
          visits: [
            {
              prisonerNumber: 'XYZ345',
              cancelled: false,
              scheduledInstanceId: null,
              startTime: '19:00',
              endTime: '12:00',
            },
          ],
          adjudications: [],
        } as PrisonerScheduledEvents)
    })

    it('should retrieve attendances', async () => {
      req.body = {
        selectedAttendances: ['999-1', '999-2'],
      }

      await handler.GET_ATTENDANCES(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attendance-list-multiple', {
        attendanceRows: [
          {
            instance: instanceA,
            session: 'AM',
            prisoner: prisonersToAttend[0],
            attendance: instanceA.attendances[0],
            otherEvents: [
              {
                prisonerNumber: 'ABC123',
                cancelled: true,
                scheduledInstanceId: 344,
                startTime: '09:00',
                endTime: '12:00',
              },
              {
                prisonerNumber: 'ABC123',
                cancelled: false,
                scheduledInstanceId: null,
                startTime: '09:00',
                endTime: '12:00',
              },
            ],
            isAmendable: true,
            userMap: undefined,
          },
          {
            instance: instanceA,
            session: 'AM',
            prisoner: prisonersToAttend[1],
            attendance: instanceA.attendances[1],
            otherEvents: [],
            isAmendable: true,
            userMap: undefined,
          },
          {
            instance: instanceA,
            session: 'AM',
            prisoner: prisonersToAttend[2],
            attendance: instanceA.attendances[2],
            otherEvents: [],
            isAmendable: true,
            userMap: undefined,
          },
          {
            instance: instanceB,
            session: 'PM',
            prisoner: prisonersToAttend[0],
            attendance: instanceB.attendances[0],
            otherEvents: [],
            isAmendable: true,
            userMap: undefined,
          },
          {
            instance: instanceB,
            session: 'PM',
            prisoner: prisonersToAttend[3],
            attendance: instanceB.attendances[1],
            otherEvents: [
              {
                prisonerNumber: 'XYZ345',
                cancelled: false,
                scheduledInstanceId: null,
                startTime: '19:00',
                endTime: '12:00',
              },
            ],
            isAmendable: true,
            userMap: undefined,
          },
        ],
        numActivities: 2,
        attendanceSummary: getAttendanceSummary([...instanceA.attendances, ...instanceB.attendances]),
        selectedDate: instanceA.date,
        selectedSessions: ['AM', 'PM'],
      })
    })

    it('should retrieve filtered attendances', async () => {
      req.body = {
        selectedAttendances: ['999-1', '999-2'],
      }

      req.query.searchTerm = 'jOe'

      await handler.GET_ATTENDANCES(req, res)

      const expectedSummary = [instanceA.attendances[0], instanceB.attendances[0]]

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attendance-list-multiple', {
        attendanceRows: [
          {
            instance: instanceA,
            session: 'AM',
            prisoner: prisonersToAttend[0],
            attendance: instanceA.attendances[0],
            otherEvents: [
              {
                prisonerNumber: 'ABC123',
                cancelled: true,
                scheduledInstanceId: 344,
                startTime: '09:00',
                endTime: '12:00',
              },
              {
                prisonerNumber: 'ABC123',
                cancelled: false,
                scheduledInstanceId: null,
                startTime: '09:00',
                endTime: '12:00',
              },
            ],
            isAmendable: true,
            userMap: undefined,
          },
          {
            instance: instanceB,
            session: 'PM',
            prisoner: prisonersToAttend[0],
            attendance: instanceB.attendances[0],
            otherEvents: [],
            isAmendable: true,
            userMap: undefined,
          },
        ],
        numActivities: 2,
        attendanceSummary: getAttendanceSummary(expectedSummary),
        selectedDate: instanceA.date,
        selectedSessions: ['AM', 'PM'],
      })
    })

    it('should attend instances', async () => {
      const scheduledActivityA = {
        ...instanceA,
        activitySchedule: {
          ...instanceA.activitySchedule,
          activity: {
            ...instanceA.activitySchedule.activity,
            paid: false,
          },
        },
      }

      const scheduledActivityB = {
        ...instanceB,
        activitySchedule: {
          ...instanceB.activitySchedule,
          activity: {
            ...instanceB.activitySchedule.activity,
            paid: true,
          },
        },
      }

      when(activitiesService.getScheduledActivity).calledWith(1, res.locals.user).mockResolvedValue(scheduledActivityA)
      when(activitiesService.getScheduledActivity).calledWith(2, res.locals.user).mockResolvedValue(scheduledActivityB)

      req.body = {
        selectedAttendances: ['1-111', '2-222'],
      }

      await handler.ATTENDED_MULTIPLE(req, res)

      expect(activitiesService.updateAttendances).toHaveBeenCalledWith(
        [
          {
            id: 111,
            status: 'COMPLETED',
            attendanceReason: 'ATTENDED',
            issuePayment: false,
            prisonCode: 'LEI',
          },
          {
            id: 222,
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

    it('should update session with for non-attendance', async () => {
      req = {
        session: {
          notAttendedJourney: {},
        },
        body: {
          selectedAttendances: ['1-111-ABC123', '2-333-XYZ345'],
        },
      } as unknown as Request

      when(activitiesService.getScheduledEventsForPrisoners)
        .calledWith(expect.any(Date), ['ABC123', 'XYZ345'], res.locals.user)
        .mockResolvedValue({
          activities: [
            {
              prisonerNumber: 'ABC123',
              cancelled: true,
              scheduledInstanceId: 344,
              startTime: '09:00',
              endTime: '12:00',
            },
          ],
          appointments: [
            {
              prisonerNumber: 'ABC123',
              cancelled: false,
              scheduledInstanceId: null,
              startTime: '09:00',
              endTime: '12:00',
            },
          ],
          courtHearings: [
            {
              prisonerNumber: 'ABC123',
              cancelled: false,
              scheduledInstanceId: null,
              startTime: '14:00',
              endTime: '15:00',
            },
          ],
          visits: [
            {
              prisonerNumber: 'XYZ345',
              cancelled: false,
              scheduledInstanceId: null,
              startTime: '19:00',
              endTime: '12:00',
            },
          ],
          adjudications: [],
        } as PrisonerScheduledEvents)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123', 'XYZ345'], res.locals.user)
        .mockResolvedValue([
          {
            prisonerNumber: 'ABC123',
            firstName: 'Joe',
            lastName: 'Bloggs',
          },
          {
            prisonerNumber: 'XYZ345',
            firstName: 'Mary',
            lastName: 'Smith',
          },
        ] as Prisoner[])

      await handler.NOT_ATTENDED(req, res)

      expect(req.session.notAttendedJourney.selectedPrisoners).toEqual([
        {
          instanceId: 1,
          attendanceId: 1001,
          prisonerNumber: 'ABC123',
          prisonerName: 'Joe Bloggs',
          otherEvents: [
            {
              prisonerNumber: 'ABC123',
              cancelled: false,
              scheduledInstanceId: null,
              startTime: '09:00',
              endTime: '12:00',
            },
          ],
        },
        {
          instanceId: 2,
          attendanceId: 2002,
          prisonerNumber: 'XYZ345',
          prisonerName: 'Mary Smith',
          otherEvents: [
            {
              prisonerNumber: 'XYZ345',
              cancelled: false,
              scheduledInstanceId: null,
              startTime: '19:00',
              endTime: '12:00',
            },
          ],
        },
      ])

      expect(res.redirect).toHaveBeenCalledWith('/activities/attendance/activities/not-attended-reason')
    })
  })
})
