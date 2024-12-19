import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import UserService from '../../../../services/userService'
import AttendeesRoutes from './attendees'
import AttendanceAction from '../../../../enum/attendanceAction'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/userService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const userService = new UserService(null, null, null) as jest.Mocked<UserService>

describe('Route Handlers - Record Appointment Attendance', () => {
  const handler = new AttendeesRoutes(activitiesService, userService)

  let req: Request
  let res: Response

  const prisonCode = 'RSI'

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: prisonCode,
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      session: {},
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET_MULTIPLE', () => {
    it('should render the attendance page with appointments', async () => {
      req.session.recordAppointmentAttendanceJourney = {
        appointmentIds: [1, 2],
      }

      const appointments = [
        { id: 1, attendees: [] },
        { id: 2, attendees: [] },
      ] as AppointmentDetails[]

      when(activitiesService.getAppointments).calledWith([1, 2], res.locals.user).mockResolvedValue(appointments)

      await handler.GET_MULTIPLE(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/attendees', {
        appointments,
        attendanceSummary: {
          attendeeCount: 0,
          attended: 0,
          notAttended: 0,
          notRecorded: 0,
          attendedPercentage: 0,
          notAttendedPercentage: 0,
          notRecordedPercentage: 0,
        },
      })
    })

    it('should render the attendance page with appointments that have marked attendances', async () => {
      req.session.recordAppointmentAttendanceJourney = {
        appointmentIds: [1, 2, 3, 4, 5, 6],
      }

      const appointments = [
        { id: 1, attendees: [{ attended: true }, { attended: false }, { attended: null }, { attended: true }] },
        { id: 2, attendees: [{ attended: null }, { attended: null }] },
      ] as AppointmentDetails[]

      when(activitiesService.getAppointments)
        .calledWith([1, 2, 3, 4, 5, 6], res.locals.user)
        .mockResolvedValue(appointments)

      await handler.GET_MULTIPLE(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/attendees', {
        appointments,
        attendanceSummary: {
          attendeeCount: 6,
          attended: 2,
          notAttended: 1,
          notRecorded: 3,
          attendedPercentage: 33,
          notAttendedPercentage: 17,
          notRecordedPercentage: 50,
        },
      })
    })
  })

  describe('GET_SINGLE', () => {
    it('should update session and redirect', async () => {
      req.params = {
        appointmentId: '33',
      }

      await handler.GET_SINGLE(req, res)

      expect(res.redirect).toHaveBeenCalledWith('../attendees')
      expect(req.session.recordAppointmentAttendanceJourney.appointmentIds).toEqual([33])
    })
  })

  describe('ATTEND', () => {
    it('should record attendance for one attendee', async () => {
      req.body = {
        attendanceIds: ['44-1234BC'],
      }

      await handler.ATTEND(req, res)

      expect(activitiesService.updateMultipleAppointmentAttendances).toHaveBeenCalledWith(
        AttendanceAction.ATTENDED,
        [
          {
            appointmentId: 44,
            prisonerNumbers: ['1234BC'],
          },
        ],
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'attendees',
        'Attendance recorded',
        "You've saved attendance details for 1 attendee",
      )
    })

    it('should record attendance for multiple attendees', async () => {
      req.body = {
        attendanceIds: ['44-1234BC', '32-1234BC', '98-3456DD', '44-3456DD'],
      }

      await handler.ATTEND(req, res)

      expect(activitiesService.updateMultipleAppointmentAttendances).toHaveBeenCalledWith(
        AttendanceAction.ATTENDED,
        [
          {
            appointmentId: 44,
            prisonerNumbers: ['1234BC', '3456DD'],
          },
          {
            appointmentId: 32,
            prisonerNumbers: ['1234BC'],
          },
          {
            appointmentId: 98,
            prisonerNumbers: ['3456DD'],
          },
        ],
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'attendees',
        'Attendance recorded',
        "You've saved attendance details for 4 attendees",
      )
    })
  })

  describe('NON_ATTEND', () => {
    it('should record non-attendance for one attendee', async () => {
      req.body = {
        attendanceIds: ['44-1234BC'],
      }

      await handler.NON_ATTEND(req, res)

      expect(activitiesService.updateMultipleAppointmentAttendances).toHaveBeenCalledWith(
        AttendanceAction.NOT_ATTENDED,
        [
          {
            appointmentId: 44,
            prisonerNumbers: ['1234BC'],
          },
        ],
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'attendees',
        'Attendance recorded',
        "You've saved attendance details for 1 attendee",
      )
    })

    it('should record attendance for multiple attendees', async () => {
      req.body = {
        attendanceIds: ['44-1234BC', '32-1234BC', '98-3456DD', '44-3456DD'],
      }

      await handler.NON_ATTEND(req, res)

      expect(activitiesService.updateMultipleAppointmentAttendances).toHaveBeenCalledWith(
        AttendanceAction.NOT_ATTENDED,
        [
          {
            appointmentId: 44,
            prisonerNumbers: ['1234BC', '3456DD'],
          },
          {
            appointmentId: 32,
            prisonerNumbers: ['1234BC'],
          },
          {
            appointmentId: 98,
            prisonerNumbers: ['3456DD'],
          },
        ],
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'attendees',
        'Attendance recorded',
        "You've saved attendance details for 4 attendees",
      )
    })
  })
})
