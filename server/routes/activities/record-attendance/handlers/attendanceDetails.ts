import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'

export default class AttendanceDetailsRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params

    const instance = await this.activitiesService.getScheduledActivity(+id, user)

    const attendance = await this.activitiesService.getAttendanceDetails(+attendanceId)

    const attendee = await this.prisonService
      .getInmateByPrisonerNumber(attendance.prisonerNumber, user)
      .then(i => ({ name: `${i.firstName} ${i.lastName}` }))

    const activity = { ...instance.activitySchedule.activity }

    res.render('pages/record-attendance/attendance-details', { instance, attendance, attendee, activity })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const { attendanceId } = req.params
    return res.redirect(`/activities/attendance/activities/${id}/attendance-details/${attendanceId}/remove-pay`)
  }
}
