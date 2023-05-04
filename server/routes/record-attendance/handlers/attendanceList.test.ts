import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format, startOfYesterday } from 'date-fns'
import ActivitiesService from '../../../services/activitiesService'
import { PrisonerScheduledEvents, ScheduledActivity } from '../../../@types/activitiesAPI/types'
import PrisonService from '../../../services/prisonService'
import AttendanceListRoutes from './attendanceList'
import { Prisoner } from '../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/prisonService')

const activitiesService = new ActivitiesService(null, null)
const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Attendance List', () => {
  const handler = new AttendanceListRoutes(activitiesService, prisonService)

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
      params: { id: 1 },
      session: {
        notAttendedJourney: {},
      },
      body: {},
    } as unknown as Request

    when(activitiesService.getScheduledActivity)
      .calledWith(1, res.locals.user)
      .mockResolvedValue({
        id: 1,
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '10:00',
        endTime: '11:00',
        activitySchedule: {
          activity: {
            summary: 'Maths level 1',
            inCell: false,
          },
          internalLocation: { description: 'Houseblock 1' },
        },
        attendances: [
          { prisonerNumber: 'ABC123', status: 'WAITING' },
          { prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
          { prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
        ],
      } as ScheduledActivity)

    when(activitiesService.getScheduledEventsForPrisoners)
      .calledWith(expect.any(Date), ['ABC123', 'ABC321', 'ZXY123'], res.locals.user)
      .mockResolvedValue({
        activities: [
          {
            scheduledInstanceId: 1,
            eventType: 'ACTIVITY',
            eventSource: 'SAA',
            summary: 'Maths',
            startTime: '10:00',
            endTime: '11:00',
            prisonerNumber: 'ABC123',
          },
        ],
        appointments: [
          {
            appointmentOccurrenceId: 2,
            appointmentInstanceId: 2,
            eventType: 'APPOINTMENT',
            eventSource: 'SAA',
            summary: 'Appointment with the guv',
            startTime: '15:00',
            endTime: '16:00',
            prisonerNumber: 'ABC123',
          },
        ],
        courtHearings: [
          {
            eventId: 3,
            eventType: 'COURT_HEARING',
            eventSource: 'NOMIS',
            summary: 'Court hearing',
            startTime: '09:00',
            endTime: '10:00',
            prisonerNumber: 'ABC123',
          },
          {
            eventId: 4,
            eventType: 'COURT_HEARING',
            eventSource: 'NOMIS',
            summary: 'Court hearing',
            startTime: '10:30',
            endTime: '11:00',
            prisonerNumber: 'ABC321',
          },
        ],
        visits: [
          {
            eventId: 5,
            eventType: 'VISIT',
            eventSource: 'NOMIS',
            summary: 'Visit',
            startTime: '10:30',
            endTime: '11:00',
            prisonerNumber: 'ABC123',
          },
        ],
      } as PrisonerScheduledEvents)

    when(prisonService.searchInmatesByPrisonerNumbers)
      .calledWith(['ABC123', 'ABC321', 'ZXY123'], res.locals.user)
      .mockResolvedValue([
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
      ] as Prisoner[])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let viewContext: any = {}

    beforeEach(() => {
      viewContext = {
        activity: {
          allocated: 3,
          attended: 1,
          attendedPercentage: '33',
          location: 'Houseblock 1',
          name: 'Maths level 1',
          notAttended: 1,
          notAttendedPercentage: '33',
          notRecorded: 1,
          notRecordedPercentage: '33',
          inCell: false,
        },
        instance: {
          id: 1,
          date: format(new Date(), 'yyyy-MM-dd'),
          isAmendable: true,
          startTime: '10:00',
          endTime: '11:00',
          activitySchedule: {
            activity: {
              summary: 'Maths level 1',
              inCell: false,
            },
            internalLocation: { description: 'Houseblock 1' },
          },
          attendances: [
            { prisonerNumber: 'ABC123', status: 'WAITING' },
            { prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
            { prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
          ],
        },
        attendees: expect.arrayContaining([
          {
            category: 'A',
            alerts: [{ alertCode: 'HA' }],
            location: 'MDI-1-001',
            name: 'Joe Bloggs',
            otherEvents: [
              {
                eventSource: 'NOMIS',
                eventType: 'VISIT',
                eventId: 5,
                summary: 'Visit',
                prisonerNumber: 'ABC123',
                startTime: '10:30',
                endTime: '11:00',
              },
            ],
            prisonerNumber: 'ABC123',
            attendance: { prisonerNumber: 'ABC123', status: 'WAITING' },
          },
          {
            category: 'A',
            alerts: [],
            location: 'MDI-1-002',
            name: 'Alan Key',
            otherEvents: [
              {
                eventId: 4,
                eventSource: 'NOMIS',
                eventType: 'COURT_HEARING',
                summary: 'Court hearing',
                prisonerNumber: 'ABC321',
                startTime: '10:30',
                endTime: '11:00',
              },
            ],
            prisonerNumber: 'ABC321',
            attendance: { prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
          },
          {
            category: 'A',
            alerts: [],
            location: 'MDI-1-003',
            name: 'Mr Blobby',
            otherEvents: [],
            prisonerNumber: 'ZXY123',
            attendance: { prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
          },
        ]),
      }
    })

    it('should render with the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/attendance-list', viewContext)
    })

    it("shouldn't be amendable if session is in the past", async () => {
      viewContext.instance.isAmendable = false
      viewContext.instance.date = format(startOfYesterday(), 'yyyy-MM-dd')

      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          date: format(startOfYesterday(), 'yyyy-MM-dd'),
          startTime: '10:00',
          endTime: '11:00',
          activitySchedule: {
            activity: {
              summary: 'Maths level 1',
              inCell: false,
            },
            internalLocation: { description: 'Houseblock 1' },
          },
          attendances: [
            { prisonerNumber: 'ABC123', status: 'WAITING' },
            { prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
            { prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
          ],
        } as ScheduledActivity)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/attendance-list', viewContext)
    })
  })

  describe('ATTENDED', () => {
    it('should update attendance then redirect to the attendance list page', async () => {
      req.body = {
        selectedAttendances: ['1', '2'],
      }

      await handler.ATTENDED(req, res)

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

      expect(res.redirect).toBeCalledWith('attendance-list')
    })

    it("shouldn't update attendance when no prisoners have been selected", async () => {
      await handler.ATTENDED(req, res)

      expect(activitiesService.updateAttendances).toBeCalledTimes(0)
      expect(res.redirect).toBeCalledWith('attendance-list')
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
          activities: [
            {
              scheduledInstanceId: 1,
              eventSource: 'SAA',
              eventType: 'ACTIVITY',
              summary: 'Maths',
              startTime: '10:00',
              endTime: '11:00',
              prisonerNumber: 'ABC123',
            },
          ],
          appointments: [
            {
              appointmentInstanceId: 2,
              appointmentOccurrenceId: 2,
              eventSource: 'SAA',
              eventType: 'APPOINTMENT',
              summary: 'Appointment with the guv',
              startTime: '15:00',
              endTime: '16:00',
              prisonerNumber: 'ABC123',
            },
          ],
          courtHearings: [
            {
              eventId: 3,
              eventSource: 'NOMIS',
              eventType: 'COURT_HEARING',
              summary: 'Court hearing',
              startTime: '09:00',
              endTime: '10:00',
              prisonerNumber: 'ABC123',
            },
            {
              eventId: 4,
              eventSource: 'NOMIS',
              eventType: 'COURT_HEARING',
              summary: 'Court hearing',
              startTime: '10:30',
              endTime: '11:00',
              prisonerNumber: 'ABC321',
            },
          ],
          visits: [
            {
              eventId: 5,
              eventSource: 'NOMIS',
              eventType: 'VISIT',
              summary: 'Visit',
              startTime: '10:30',
              endTime: '11:00',
              prisonerNumber: 'ABC123',
            },
          ],
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

      expect(res.redirect).toBeCalledWith('/attendance/activities/1/not-attended-reason')
    })
  })
})
