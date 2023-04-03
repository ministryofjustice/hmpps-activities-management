import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import PrisonService from '../../../services/prisonService'

export default class AttendanceDetailsRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params

    const instance = await this.activitiesService.getScheduledActivity(+id, user)

    const attendance = await this.activitiesService.getAttendanceDetails(+attendanceId, user)

    const prisonerNumbers = [attendance.prisonerNumber]

    const attendees = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user).then(inmates =>
      inmates.map(i => ({
        name: `${i.firstName} ${i.lastName}`,
      })),
    )

    const attendee = attendees[0]

    res.render('pages/record-attendance/attendance-details', { instance, attendance, attendee })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const { attendanceId } = req.params
    return res.redirect(`/attendance/activities/${id}/attendance-details/${attendanceId}/remove-pay`)
  }
}
