import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import { Attendance, ScheduledActivity } from '../../../../../@types/activitiesAPI/types'
import { formatFirstLastName } from '../../../../../utils/utils'
import AttendanceStatus from '../../../../../enum/attendanceStatus'
import AttendanceReason from '../../../../../enum/attendanceReason'

export default class ChangePayRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params

    const [instance, attendance]: [ScheduledActivity, Attendance] = await Promise.all([
      this.activitiesService.getScheduledActivity(+id, user),
      this.activitiesService.getAttendanceDetails(+attendanceId),
    ])

    if (!instance.activitySchedule.activity.paid) {
      return res.redirect('../../attendance-list')
    }

    const attendee = await this.prisonService.getInmateByPrisonerNumber(attendance.prisonerNumber, user)

    return res.render('pages/activities/record-attendance/advance-attendance-change-pay', {
      instance,
      attendance,
      attendee,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { attendanceId } = req.params

    const attendance: Attendance = await this.activitiesService.getAttendanceDetails(+attendanceId)
    const newIssuePayment = !attendance.issuePayment
    const attendee = await this.prisonService.getInmateByPrisonerNumber(attendance.prisonerNumber, user)

    const attendances = [
      {
        id: +attendanceId,
        prisonCode: user.activeCaseLoadId,
        status: AttendanceStatus.COMPLETED,
        attendanceReason: attendance.attendanceReason?.code || AttendanceReason.NOT_REQUIRED,
        issuePayment: newIssuePayment,
      },
    ]

    await this.activitiesService.updateAttendances(attendances, user)
    const successMessage = `${formatFirstLastName(attendee.firstName, attendee.lastName)} will now${newIssuePayment ? ' ' : ' not '}be paid for this session.`
    return res.redirectWithSuccess('../../attendance-list', 'Pay updated', successMessage)
  }
}
