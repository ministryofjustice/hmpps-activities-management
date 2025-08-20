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
  @IsEnum(YesNo, { message: "Confirm if you want to reset this person's attendance record or not" })
  confirm: YesNo
}

export default class ResetAttendanceRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { attendanceId } = req.params

    const attendance = await this.activitiesService.getAttendanceDetails(+attendanceId)
    const attendee = await this.prisonService.getInmateByPrisonerNumber(attendance.prisonerNumber, user)

    res.render('pages/activities/record-attendance/reset-attendance', { attendance, attendee })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params
    const { confirm } = req.body

    const returnUrl = req.journeyData.recordAttendanceJourney.singleInstanceSelected
      ? `../../../${id}/attendance-list`
      : '../../../attendance-list'

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

      // TODO: SAA-1737 Add activity name?
      const successMessage = `Attendance for ${attendeeName} has been reset`
      return res.redirectWithSuccess(returnUrl, 'Attendance reset', successMessage)
    }

    return res.redirect(returnUrl)
  }
}
