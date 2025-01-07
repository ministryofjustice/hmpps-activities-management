import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import AttendanceAction from '../../../../enum/attendanceAction'

enum EditAttendanceOptions {
  YES = 'yes',
  NO = 'no',
  RESET = 'reset',
}

export class EditAttendance {
  @Expose()
  @IsIn(Object.values(EditAttendanceOptions), {
    message: 'Select if you want to change the attendance, leave it or reset it',
  })
  attendanceOption: string
}

export default class EditAttendanceRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId, prisonerNumber } = req.params

    const appointment = await this.activitiesService.getAppointmentDetails(+appointmentId, user)

    const attendee = appointment.attendees.find(a => a.prisoner.prisonerNumber === prisonerNumber)

    const attendanceDetails = {
      appointmentId: appointment.id,
      appointmentName: appointment.appointmentName,
      appointmentDate: appointment.startDate,
      prisonerName: `${attendee.prisoner.firstName} ${attendee.prisoner.lastName}`,
    }

    res.render('pages/appointments/attendance/edit-attendance', { attendanceDetails })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId, prisonerNumber } = req.params

    const appointment = await this.activitiesService.getAppointmentDetails(+appointmentId, user)

    const attendee = appointment.attendees.find(a => a.prisoner.prisonerNumber === prisonerNumber)

    let successHeader = 'Attendance recorded'
    let successMessage = `You've saved details for ${attendee.prisoner.firstName} ${attendee.prisoner.lastName}`
    let action = AttendanceAction.ATTENDED

    if (req.body.attendanceOption === EditAttendanceOptions.NO) {
      successHeader = 'Non-attendance recorded'
      action = AttendanceAction.NOT_ATTENDED
    } else if (req.body.attendanceOption === EditAttendanceOptions.RESET) {
      successHeader = 'Attendance reset'
      successMessage = `Attendance for ${attendee.prisoner.firstName} ${attendee.prisoner.lastName} has been reset`
      action = AttendanceAction.RESET
    }

    const requests = [
      {
        appointmentId: +appointmentId,
        prisonerNumbers: [prisonerNumber],
      },
    ]

    await this.activitiesService.updateMultipleAppointmentAttendances(action, requests, user)

    return res.redirectWithSuccess('../../../attendees', successHeader, successMessage)
  }
}
