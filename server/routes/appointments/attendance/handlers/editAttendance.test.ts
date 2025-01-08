import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import EditAttendanceRoutes from './editAttendance'
import { EditAttendance } from '../../../activities/record-attendance/handlers/editAttendance'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import AttendanceAction from '../../../../enum/attendanceAction'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Edit Appointment Attendance', () => {
  const handler = new EditAttendanceRoutes(activitiesService)

  let req: Request
  let res: Response

  const appointment = {
    id: 123,
    appointmentName: 'Chaplaincy',
    startDate: '2024-12-01',
    attendees: [
      {
        prisoner: {
          prisonerNumber: 'DD111D',
          firstName: 'Steve',
          lastName: 'Jones',
        },
      },
      {
        prisoner: {
          prisonerNumber: 'ZB1123S',
          firstName: 'Joe',
          lastName: 'Bloggs',
        },
      },
    ],
  } as AppointmentDetails

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
        },
      },
      render: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        appointmentId: '123',
        prisonerNumber: 'ZB1123S',
      },
    } as unknown as Request

    when(activitiesService.getAppointmentDetails).calledWith(123, res.locals.user).mockResolvedValue(appointment)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('Should render the page', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/edit-attendance', {
        attendanceDetails: {
          appointmentId: 123,
          appointmentName: 'Chaplaincy',
          appointmentDate: '2024-12-01',
          prisonerName: 'Joe Bloggs',
        },
      })
    })
  })

  describe('POST', () => {
    const requests = [
      {
        appointmentId: 123,
        prisonerNumbers: ['ZB1123S'],
      },
    ]

    beforeEach(() => {
      req.body = {}
    })

    it('Should redirect when the yes attendance option is selected', async () => {
      req.body.attendanceOption = 'yes'

      await handler.POST(req, res)

      expect(activitiesService.updateMultipleAppointmentAttendances).toHaveBeenCalledWith(
        AttendanceAction.ATTENDED,
        requests,
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../../../attendees',
        'Attendance recorded',
        "You've saved details for Joe Bloggs",
      )
    })

    it('Should redirect when the non attendance option is selected', async () => {
      req.body.attendanceOption = 'no'

      await handler.POST(req, res)

      expect(activitiesService.updateMultipleAppointmentAttendances).toHaveBeenCalledWith(
        AttendanceAction.NOT_ATTENDED,
        requests,
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../../../attendees',
        'Non-attendance recorded',
        "You've saved details for Joe Bloggs",
      )
    })

    it('Should redirect when the reset option is selected', async () => {
      req.body.attendanceOption = 'reset'

      await handler.POST(req, res)

      expect(activitiesService.updateMultipleAppointmentAttendances).toHaveBeenCalledWith(
        AttendanceAction.RESET,
        requests,
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../../../attendees',
        'Attendance reset',
        'Attendance for Joe Bloggs has been reset',
      )
    })
  })

  describe('Validation', () => {
    it('Should fail when confirmation value not selected', async () => {
      const body = {}

      const requestObject = plainToInstance(EditAttendance, body)

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'attendanceOption', error: 'Select if you want to change the attendance, leave it or reset it' },
      ])
    })

    it('Should pass when valid confirmation option selected', async () => {
      const body = {
        attendanceOption: 'reset',
      }

      const requestObject = plainToInstance(EditAttendance, body)

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
