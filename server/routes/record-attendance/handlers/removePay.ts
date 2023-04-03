import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../services/activitiesService'
import PrisonService from '../../../services/prisonService'
import AttendanceReason from '../../../enum/attendanceReason'
import AttendanceStatus from '../../../enum/attendanceStatus'

enum RemovePayOptions {
  YES = 'yes',
  NO = 'no',
}

export class RemovePay {
  @Expose()
  @IsIn(Object.values(RemovePayOptions), { message: 'Select a remove pay option' })
  removePayOption: string
}
export default class RemovePayRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params

    const instance = await this.activitiesService.getScheduledActivity(+id, user)

    const attendance = await this.activitiesService.getAttendanceDetails(+attendanceId, user)

    const attendee = await this.prisonService
      .getInmateByPrisonerNumber(attendance.prisonerNumber, user)
      .then(i => ({ name: `${i.firstName} ${i.lastName}` }))

    res.render('pages/record-attendance/remove-pay', { instance, attendance, attendee })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params
    if (req.body.removePayOption === 'yes') {
      const attendances = [
        {
          id: +attendanceId,
          status: AttendanceStatus.COMPLETED,
          attendanceReason: AttendanceReason.ATTENDED,
          issuePayment: false,
        },
      ]
      await this.activitiesService.updateAttendances(attendances, user)
    }
    return res.redirect(`/attendance/activities/${id}/attendance-details/${attendanceId}`)
  }
}
