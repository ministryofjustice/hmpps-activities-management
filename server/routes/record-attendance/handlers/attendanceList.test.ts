import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format, startOfToday, startOfYesterday } from 'date-fns'
import ActivitiesService from '../../../services/activitiesService'
import { PrisonerScheduledEvents, ScheduledActivity } from '../../../@types/activitiesAPI/types'
import PrisonService from '../../../services/prisonService'
import AttendanceListRoutes from './attendanceList'
import { InmateBasicDetails } from '../../../@types/prisonApiImport/types'

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
          activity: { summary: 'Maths level 1' },
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
          { eventId: 1, eventDesc: 'Maths', startTime: '10:00', endTime: '11:00', prisonerNumber: 'ABC123' },
        ],
        appointments: [
          {
            eventId: 2,
            eventDesc: 'Appointment with the guv',
            startTime: '15:00',
            endTime: '16:00',
            prisonerNumber: 'ABC123',
          },
        ],
        courtHearings: [
          { eventId: 3, eventDesc: 'Video link', startTime: '09:00', endTime: '10:00', prisonerNumber: 'ABC123' },
          { eventId: 4, eventDesc: 'Video link', startTime: '10:30', endTime: '11:00', prisonerNumber: 'ABC321' },
        ],
        visits: [{ eventId: 5, eventDesc: 'Visit', startTime: '10:30', endTime: '11:00', prisonerNumber: 'ABC123' }],
      } as PrisonerScheduledEvents)

    when(prisonService.getInmateDetails)
      .calledWith(['ABC123', 'ABC321', 'ZXY123'], res.locals.user)
      .mockResolvedValue([
        { offenderNo: 'ABC123', firstName: 'Joe', lastName: 'Bloggs', assignedLivingUnitDesc: 'MDI-1-001' },
        { offenderNo: 'ABC321', firstName: 'Alan', lastName: 'Key', assignedLivingUnitDesc: 'MDI-1-002' },
        { offenderNo: 'ZXY123', firstName: 'Mr', lastName: 'Blobby', assignedLivingUnitDesc: 'MDI-1-003' },
      ] as InmateBasicDetails[])
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
          date: startOfToday(),
          location: 'Houseblock 1',
          name: 'Maths level 1',
          notAttended: 1,
          notRecorded: 1,
          time: '10:00 - 11:00',
        },
        instance: {
          id: 1,
          date: format(new Date(), 'yyyy-MM-dd'),
          isAmendable: true,
          startTime: '10:00',
          endTime: '11:00',
          activitySchedule: {
            activity: { summary: 'Maths level 1' },
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
            location: 'MDI-1-001',
            name: 'Joe Bloggs',
            otherEvents: [
              {
                endTime: '11:00',
                eventDesc: 'Visit',
                eventId: 5,
                prisonerNumber: 'ABC123',
                startTime: '10:30',
              },
            ],
            prisonerNumber: 'ABC123',
            attendance: { prisonerNumber: 'ABC123', status: 'WAITING' },
          },
          {
            location: 'MDI-1-002',
            name: 'Alan Key',
            otherEvents: [
              {
                startTime: '10:30',
                endTime: '11:00',
                eventDesc: 'Video link',
                eventId: 4,
                prisonerNumber: 'ABC321',
              },
            ],
            prisonerNumber: 'ABC321',
            attendance: { prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
          },
          {
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
      viewContext.activity.date = startOfYesterday()
      viewContext.instance.date = format(startOfYesterday(), 'yyyy-MM-dd')

      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          date: format(startOfYesterday(), 'yyyy-MM-dd'),
          startTime: '10:00',
          endTime: '11:00',
          activitySchedule: {
            activity: { summary: 'Maths level 1' },
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
            attendanceReason: 'ATTENDED',
          },
          {
            id: 2,
            attendanceReason: 'ATTENDED',
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
            { eventId: 1, eventDesc: 'Maths', startTime: '10:00', endTime: '11:00', prisonerNumber: 'ABC123' },
          ],
          appointments: [
            {
              eventId: 2,
              eventDesc: 'Appointment with the guv',
              startTime: '15:00',
              endTime: '16:00',
              prisonerNumber: 'ABC123',
            },
          ],
          courtHearings: [
            { eventId: 3, eventDesc: 'Video link', startTime: '09:00', endTime: '10:00', prisonerNumber: 'ABC123' },
            { eventId: 4, eventDesc: 'Video link', startTime: '10:30', endTime: '11:00', prisonerNumber: 'ABC321' },
          ],
          visits: [{ eventId: 5, eventDesc: 'Visit', startTime: '10:30', endTime: '11:00', prisonerNumber: 'ABC123' }],
        } as PrisonerScheduledEvents)

      when(prisonService.getInmateDetails)
        .calledWith(['ABC123'], res.locals.user)
        .mockResolvedValue([
          { offenderNo: 'ABC123', firstName: 'Joe', lastName: 'Bloggs', assignedLivingUnitDesc: 'MDI-1-001' },
        ] as InmateBasicDetails[])

      await handler.NOT_ATTENDED(req, res)

      expect(res.redirect).toBeCalledWith('/attendance/activities/1/not-attended-reason')
    })
  })
})
