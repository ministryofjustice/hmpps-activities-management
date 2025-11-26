import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format } from 'date-fns'
import SelectPeopleToRecordAttendanceForRoutes from './selectPeopleToRecordAttendanceFor'
import ActivitiesService from '../../../../../services/activitiesService'
import UserService from '../../../../../services/userService'
import PrisonService from '../../../../../services/prisonService'
import {
  PrisonerScheduledEvents,
  ScheduledActivity,
  ScheduledAttendee,
} from '../../../../../@types/activitiesAPI/types'
import atLeast from '../../../../../../jest.setup'
import { UserDetails } from '../../../../../@types/manageUsersApiImport/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import { ScheduledInstanceAttendance } from '../attendanceList'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/userService')
jest.mock('../../../../../services/prisonService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)
const userService = new UserService(null)

const today = format(new Date(), 'yyyy-MM-dd')

const scheduledActivity1 = {
  id: 123456,
  date: today,
  startTime: '08:45',
  endTime: '11:45',
  timeSlot: 'AM',
  cancelled: false,
  comment: null,
  attendances: [{ id: 1001, prisonerNumber: 'ABC123', status: 'WAITING' }],
  advanceAttendances: [],
  activitySchedule: {
    id: 518,
    description: 'A Wing Cleaner 2',
    internalLocation: null,
    activity: {
      id: 539,
    },
    startDate: '2023-10-24',
    endDate: '2026-10-05',
  },
} as unknown as ScheduledActivity

const scheduledActivity2 = {
  id: 123457,
  date: today,
  startTime: '13:45',
  endTime: '16:45',
  timeSlot: 'PM',
  cancelled: false,
  comment: null,
  attendances: [{ id: 1002, prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } }],
  advanceAttendances: [],
  activitySchedule: {
    id: 518,
    description: 'A Wing Cleaner 2',
    internalLocation: null,
    activity: {
      id: 539,
    },
    startDate: '2023-10-24',
    endDate: '2026-10-05',
  },
} as unknown as ScheduledActivity

const scheduledEvents = {
  activities: [],
  appointments: [],
  courtHearings: [],
  visits: [],
  adjudications: [],
} as PrisonerScheduledEvents

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
] as Prisoner[]

const updatedInstance1 = {
  ...scheduledActivity1,
  isAmendable: true,
  isInFuture: false,
}
const updatedInstance2 = {
  ...scheduledActivity2,
  isAmendable: true,
  isInFuture: false,
}

const attendanceSummary = {
  attendanceCount: 1,
  attended: 0,
  attendedPercentage: '0',
  notAttended: 0,
  notAttendedPercentage: '0',
  notRecorded: 1,
  notRecordedPercentage: '100',
}

describe('Route Handlers - Select people to record attendance for', () => {
  const handler = new SelectPeopleToRecordAttendanceForRoutes(activitiesService, prisonService, userService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      query: {
        date: '2025-09-19',
        timePeriods: 'AM,PM,ED',
        activityId: '539',
      },
      journeyData: {
        recordAttendanceJourney: {},
      },
    } as unknown as Request

    when(activitiesService.getScheduledActivitiesAtPrison)
      .calledWith(expect.any(Date), res.locals.user)
      .mockResolvedValue([scheduledActivity1])

    when(userService.getUserMap)
      .calledWith(atLeast([null]))
      .mockResolvedValue(new Map([]) as Map<string, UserDetails>)

    when(activitiesService.getAttendees)
      .calledWith(123456, res.locals.user)
      .mockResolvedValue([{ prisonerNumber: 'ABC123', scheduledInstanceId: 123456 }] as ScheduledAttendee[])

    when(activitiesService.getAttendees)
      .calledWith(123457, res.locals.user)
      .mockResolvedValue([] as ScheduledAttendee[])

    when(activitiesService.getScheduledEventsForPrisoners)
      .calledWith(expect.any(Date), expect.any(Array), res.locals.user)
      .mockResolvedValue(scheduledEvents)

    when(prisonService.searchInmatesByPrisonerNumbers)
      .calledWith(expect.any(Array), res.locals.user)
      .mockResolvedValue(prisoners)
  })

  describe('GET', () => {
    it('should render the expected view for a single instance', async () => {
      const attendanceRows = [
        {
          prisoner: prisoners[0],
          attendance: { id: 1001, prisonerNumber: 'ABC123', status: 'WAITING' },
          advancedAttendance: undefined,
          instance: updatedInstance1,
          otherEvents: [],
        },
      ] as unknown as ScheduledInstanceAttendance[]
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/attend-all/select-people-to-record-attendance-for',
        {
          attendanceRows,
          attendanceSummary,
          singleInstance: true,
          instance: updatedInstance1,
          instances: [updatedInstance1],
          selectedSessions: ['AM'],
          userMap: undefined,
          isCancelled: false,
        },
      )
    })

    it('should render the expected view for multiple time periods', async () => {
      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(expect.any(Date), res.locals.user)
        .mockResolvedValue([scheduledActivity1, scheduledActivity2])

      when(userService.getUserMap)
        .calledWith(atLeast([null]))
        .mockResolvedValue(new Map([]) as Map<string, UserDetails>)

      when(activitiesService.getAttendees)
        .calledWith(123456, res.locals.user)
        .mockResolvedValue([{ prisonerNumber: 'ABC123', scheduledInstanceId: 123456 }] as ScheduledAttendee[])

      when(activitiesService.getAttendees)
        .calledWith(123457, res.locals.user)
        .mockResolvedValue([{ prisonerNumber: 'ABC321', scheduledInstanceId: 123457 }] as ScheduledAttendee[])

      when(activitiesService.getScheduledEventsForPrisoners)
        .calledWith(expect.any(Date), ['ABC123', 'ABC321'], res.locals.user)
        .mockResolvedValue(scheduledEvents)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123', 'ABC321'], res.locals.user)
        .mockResolvedValue(prisoners)

      const attendanceRows = [
        {
          prisoner: prisoners[0],
          attendance: { id: 1001, prisonerNumber: 'ABC123', status: 'WAITING' },
          advancedAttendance: undefined,
          instance: updatedInstance1,
          otherEvents: [],
        },
        {
          prisoner: prisoners[1],
          attendance: {
            id: 1002,
            prisonerNumber: 'ABC321',
            status: 'COMPLETED',
            attendanceReason: { code: 'ATTENDED' },
          },
          advancedAttendance: undefined,
          instance: updatedInstance2,
          otherEvents: [],
        },
      ] as unknown as ScheduledInstanceAttendance[]
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/attend-all/select-people-to-record-attendance-for',
        {
          attendanceRows,
          attendanceSummary: {
            attendanceCount: 2,
            attended: 1,
            attendedPercentage: '50',
            notAttended: 0,
            notAttendedPercentage: '0',
            notRecorded: 1,
            notRecordedPercentage: '50',
          },
          singleInstance: false,
          instance: updatedInstance1,
          instances: [updatedInstance1, updatedInstance2],
          selectedSessions: ['AM', 'PM'],
          userMap: undefined,
          isCancelled: false,
        },
      )
    })
  })

  describe('ATTENDED', () => {
    it('should redirect with success', async () => {
      req.journeyData.recordAttendanceJourney.returnUrl =
        '/activities/record-attendance/attend-all/choose-details-by-activity?date=2025-01-01&timePeriods=AM%2CPM%2CED&activityId=539'
      req.body = {
        selectedAttendances: ['123456-1001-ABC123', '123457-1002-ABC321'],
      }
      when(activitiesService.getScheduledActivities)
        .calledWith([123456, 123457], res.locals.user)
        .mockResolvedValue([scheduledActivity1, scheduledActivity2])
      await handler.ATTENDED(req, res)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/record-attendance/attend-all/choose-details-by-activity?date=2025-01-01&timePeriods=AM%2CPM%2CED&activityId=539',
        'Attendance recorded',
        "You've saved attendance details for 2 attendees",
      )
    })
  })

  describe('NOT_ATTENDED', () => {
    it('should redirect with success', async () => {
      req.body = {
        selectedAttendances: ['123456-1001-ABC123', '123457-1002-ABC321'],
      }

      when(activitiesService.getScheduledActivities)
        .calledWith([123456, 123457], res.locals.user)
        .mockResolvedValue([scheduledActivity1, scheduledActivity2])
      await handler.NOT_ATTENDED(req, res)
      expect(res.redirect).toHaveBeenCalledWith('../activities/not-attended-reason')
    })
  })

  describe('NOT_REQUIRED_OR_EXCUSED', () => {
    it('should redirect with success', async () => {
      req.body = {
        selectedAttendances: ['123456-1001-ABC123', '123457-1002-ABC321'],
      }

      when(activitiesService.getScheduledActivities)
        .calledWith([123456, 123457], res.locals.user)
        .mockResolvedValue([scheduledActivity1, scheduledActivity2])
      await handler.NOT_REQUIRED_OR_EXCUSED(req, res)
      expect(res.redirect).toHaveBeenCalledWith('../activities/123456/not-required-or-excused/check-and-confirm')
    })
  })
})
