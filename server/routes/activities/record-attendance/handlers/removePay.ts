import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn, IsNotEmpty, MaxLength, ValidateIf } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import AttendanceReason from '../../../../enum/attendanceReason'
import AttendanceStatus from '../../../../enum/attendanceStatus'

enum RemovePayOptions {
  YES = 'yes',
  NO = 'no',
}

export class RemovePay {
  @Expose()
  @IsIn(Object.values(RemovePayOptions), { message: "Confirm if you want to remove this person's pay or not" })
  removePayOption: string

  @ValidateIf(o => o.removePayOption === RemovePayOptions.YES)
  @IsNotEmpty({ message: 'Enter a case note' })
  @MaxLength(4000, { message: 'Case note must be 4,000 characters or less' })
  caseNote: string
}
export default class RemovePayRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params

    const [instance, attendance] = await Promise.all([
      this.activitiesService.getScheduledActivity(+id, user),
      this.activitiesService.getAttendanceDetails(+attendanceId),
    ])

    const attendee = await this.prisonService
      .getInmateByPrisonerNumber(attendance.prisonerNumber, user)
      .then(i => ({ name: `${i.firstName} ${i.lastName}` }))

    res.render('pages/activities/record-attendance/remove-pay', { instance, attendance, attendee })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params
    if (req.body.removePayOption === 'yes') {
      const attendances = [
        {
          id: +attendanceId,
          prisonCode: user.activeCaseLoadId,
          status: AttendanceStatus.COMPLETED,
          attendanceReason: AttendanceReason.ATTENDED,
          issuePayment: false,
          payAmount: null as number,
          caseNote: req.body.caseNote,
        },
      ]
      await this.activitiesService.updateAttendances(attendances, user)
    }
    return res.redirect(`/activities/attendance/activities/${id}/attendance-details/${attendanceId}`)
  }
}
