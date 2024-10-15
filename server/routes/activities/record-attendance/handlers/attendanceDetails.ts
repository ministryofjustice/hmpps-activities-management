import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import UserService from '../../../../services/userService'
import { Attendance, ScheduledActivity } from '../../../../@types/activitiesAPI/types'

export default class AttendanceDetailsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly userService: UserService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params

    const [instance, attendance]: [ScheduledActivity, Attendance] = await Promise.all([
      this.activitiesService.getScheduledActivity(+id, user),
      this.activitiesService.getAttendanceDetails(+attendanceId),
    ])

    const attendee = await this.prisonService
      .getInmateByPrisonerNumber(attendance.prisonerNumber, user)
      .then(i => ({ name: `${i.firstName} ${i.lastName}` }))

    const activity = { ...instance.activitySchedule.activity }

    const userMap = await this.userService.getUserMap(
      [attendance.recordedBy, attendance.attendanceHistory.map(a => a.recordedBy)].flat(),
      user,
    )

    res.render('pages/activities/record-attendance/attendance-details', {
      instance,
      attendance,
      attendee,
      activity,
      userMap,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { attendanceId } = req.params
    return res.redirect(`${attendanceId}/remove-pay`)
  }
}
