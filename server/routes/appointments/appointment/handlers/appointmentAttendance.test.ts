import { Request, Response } from 'express'
import { subDays } from 'date-fns'
import { when } from 'jest-when'
import AppointmentAttendanceRoutes from './appointmentAttendance'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentDetails, AppointmentAttendeeSummary } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'
import UserService from '../../../../services/userService'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/userService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const userService = new UserService(null, null, null) as jest.Mocked<UserService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Record Appointment Attendance', () => {
  const handler = new AppointmentAttendanceRoutes(activitiesService, userService, prisonService)
  let req: Request
  let res: Response

  const yesterday = subDays(new Date(), 1)
  const prisonCode = 'RSI'

  const appointment = {
    id: 10,
    prisonCode,
    attendees: [],
    startDate: formatDate(yesterday, 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:30',
  } as AppointmentDetails

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: prisonCode,
        },
      },
      render: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        appointmentId: appointment.id.toString(),
      },
      appointment,
    } as unknown as Request

    const prisonerInfo = {
      prisonerNumber: 'G4793VF',
      firstName: 'JO',
      lastName: 'BLOGGS',
      cellLocation: '1-1-1',
      currentIncentive: {
        level: {
          description: 'Standard',
        },
      },
    } as Prisoner

    when(prisonService.getInmateByPrisonerNumber).calledWith('A1234BC', res.locals.user).mockResolvedValue(prisonerInfo)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the appointment attendance page with an appointment that has no attendees', async () => {
      appointment.attendees = []
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment/attendance', {
        appointment,
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

    it('should render the appointment attendance page with an appointment that has marked attendance', async () => {
      appointment.attendees = [
        {
          attended: true,
        },
        {
          attended: true,
        },
        {
          attended: false,
        },
        {
          attended: null,
        },
        {
          attended: null,
        },
        {
          attended: null,
        },
      ] as unknown as AppointmentAttendeeSummary[]
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment/attendance', {
        appointment,
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

  describe('ATTEND', () => {
    it('should record attendance for one person', async () => {
      const prisonNumbers = ['A1234BC']
      req.body = {
        prisonNumbers,
      }
      await handler.ATTEND(req, res)
      expect(activitiesService.markAppointmentAttendance).toHaveBeenCalledWith(
        appointment.id,
        prisonNumbers,
        [],
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'attendance',
        'Attendance recorded',
        'You’ve recorded that Jo Bloggs attended this appointment',
      )
    })

    it('should record attendance for two people', async () => {
      const prisonNumbers = ['A1234BC', 'B2345CD']
      req.body = {
        prisonNumbers,
      }
      await handler.ATTEND(req, res)
      expect(activitiesService.markAppointmentAttendance).toHaveBeenCalledWith(
        appointment.id,
        prisonNumbers,
        [],
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'attendance',
        'Attendance recorded',
        'You’ve recorded that 2 people attended this appointment',
      )
    })
  })

  describe('NON_ATTEND', () => {
    it('should record non-attendance for one person', async () => {
      const prisonNumbers = ['A1234BC']
      req.body = {
        prisonNumbers,
      }
      await handler.NON_ATTEND(req, res)
      expect(activitiesService.markAppointmentAttendance).toHaveBeenCalledWith(
        appointment.id,
        [],
        prisonNumbers,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'attendance',
        'Non-attendance recorded',
        'You’ve recorded that Jo Bloggs did not attend this appointment',
      )
    })

    it('should record attendance for two people', async () => {
      const prisonNumbers = ['A1234BC', 'B2345CD']
      req.body = {
        prisonNumbers,
      }
      await handler.NON_ATTEND(req, res)
      expect(activitiesService.markAppointmentAttendance).toHaveBeenCalledWith(
        appointment.id,
        [],
        prisonNumbers,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'attendance',
        'Non-attendance recorded',
        'You’ve recorded that 2 people did not attend this appointment',
      )
    })
  })
})
