import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { Attendance, PrisonerScheduledEvents, ScheduledActivity } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import EditAttendanceRoutes from './editAttendance'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null, null)
const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Edit Attendance', () => {
  const handler = new EditAttendanceRoutes(activitiesService, prisonService)

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
      params: { id: 1, attendanceId: 1 },
      session: {
        notAttendedJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render with the expected view', async () => {
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

      when(activitiesService.getAttendanceDetails)
        .calledWith(1)
        .mockResolvedValue({
          id: 1,
          prisonerNumber: 'ABC321',
          status: 'COMPLETED',
          attendanceReason: { code: 'ATTENDED' },
        } as Attendance)

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('ABC321', res.locals.user)
        .mockResolvedValue({
          prisonerNumber: 'ABC321',
          firstName: 'Alan',
          lastName: 'Key',
          cellLocation: 'MDI-1-002',
          alerts: [],
          category: 'A',
        } as Prisoner)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/edit-attendance', {
        instance: {
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
        },
        attendance: {
          attendanceReason: { code: 'ATTENDED' },
          id: 1,
          prisonerNumber: 'ABC321',
          status: 'COMPLETED',
        },
        attendee: {
          name: 'Alan Key',
        },
      })
    })
  })

  describe('POST', () => {
    it('redirect as expected when the yes attendance option is selected', async () => {
      req.body = {
        attendanceOption: 'yes',
      }

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`/activities/attendance/activities/1/attendance-list`)
    })

    it('redirect as expected when the no attendance option is selected', async () => {
      req.body = {
        attendanceOption: 'no',
      }
      when(activitiesService.getAttendanceDetails)
        .calledWith(1)
        .mockResolvedValue({
          id: 1,
          prisonerNumber: 'ABC321',
          status: 'COMPLETED',
          attendanceReason: { code: 'ATTENDED' },
        } as Attendance)

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
        .calledWith(expect.any(Date), ['ABC321'], res.locals.user)
        .mockResolvedValue({
          activities: [
            {
              eventSource: 'SAA',
              eventType: 'ACTIVITY',
              scheduledInstanceId: 1,
              summary: 'Maths',
              startTime: '10:00',
              endTime: '11:00',
              prisonerNumber: 'ABC321',
            },
          ],
          appointments: [
            {
              eventSource: 'SAA',
              eventType: 'ACTIVITY',
              appointmentInstanceId: 2,
              appointmentOccurrenceId: 2,
              summary: 'Appointment with the guv',
              startTime: '15:00',
              endTime: '16:00',
              prisonerNumber: 'ABC321',
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
              prisonerNumber: 'ABC321',
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
              prisonerNumber: 'ABC321',
            },
          ],
        } as PrisonerScheduledEvents)

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('ABC321', res.locals.user)
        .mockResolvedValue({
          prisonerNumber: 'ABC321',
          firstName: 'Alan',
          lastName: 'Key',
          cellLocation: 'MDI-1-002',
          alerts: [],
          category: 'A',
        } as Prisoner)

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        `/activities/attendance/activities/1/not-attended-reason?preserveHistory=true`,
      )
    })

    it('redirect as expected when the reset attendance option is selected', async () => {
      req.body = {
        attendanceOption: 'reset',
      }

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(
        `/activities/attendance/activities/1/attendance-details/1/reset-attendance`,
      )
    })
  })
})
