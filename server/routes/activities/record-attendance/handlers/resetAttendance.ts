import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { YesNo } from '../../../../@types/activities'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import { convertToTitleCase } from '../../../../utils/utils'

export class ResetAttendance {
  @Expose()
  @IsEnum(YesNo, { message: "Select 'Yes' to confirm or 'No' to cancel" })
  confirm: YesNo
}

export default class ResetAttendanceRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { attendanceId } = req.params

    const attendance = await this.activitiesService.getAttendanceDetails(+attendanceId)
    const attendee = await this.prisonService.getInmateByPrisonerNumber(attendance.prisonerNumber, user)

    res.render('pages/record-attendance/reset-attendance', { attendance, attendee })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params
    const { confirm } = req.body

    if (confirm === YesNo.YES) {
      const attendances = [
        {
          id: +attendanceId,
          prisonCode: user.activeCaseLoadId,
          status: AttendanceStatus.WAITING,
        },
      ]
      await this.activitiesService.updateAttendances(attendances, user)

      const attendance = await this.activitiesService.getAttendanceDetails(+attendanceId)
      const attendee = await this.prisonService.getInmateByPrisonerNumber(attendance.prisonerNumber, user)
      const attendeeName = convertToTitleCase(`${attendee.firstName} ${attendee.lastName}`)

      const successMessage = `Attendance for ${attendeeName} has been reset`
      return res.redirectWithSuccess(
        `/activities/attendance/activities/${id}/attendance-list`,
        'Attendance reset',
        successMessage,
      )
    }

    return res.redirect(`/activities/attendance/activities/${id}/attendance-list`)
  }
}
