import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import UserService from '../../../../services/userService'

export default class AttendanceDetailsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly userService: UserService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId, prisonerNumber } = req.params

    const appointment = await this.activitiesService.getAppointmentDetails(+appointmentId, user)

    const attendee = appointment.attendees.find(a => a.prisoner.prisonerNumber === prisonerNumber)

    const userMap = await this.userService.getUserMap([attendee.attendanceRecordedBy], user)

    const attendanceDetails = {
      appointmentId: appointment.id,
      appointmentName: appointment.appointmentName,
      appointmentDate: appointment.startDate,
      recordedBy: attendee.attendanceRecordedBy,
      recordedTime: attendee.attendanceRecordedTime,
      attended: attendee.attended,
      prisonerNumber: attendee.prisoner.prisonerNumber,
      prisonerName: `${attendee.prisoner.firstName} ${attendee.prisoner.lastName}`,
    }

    res.render('pages/appointments/attendance/attendance-details', {
      attendanceDetails,
      userMap,
    })
  }
}
