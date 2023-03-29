import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import PrisonService from '../../../services/prisonService'

export default class AttendanceDetailsRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { attendanceId } = req.params

    const instance = await this.activitiesService.getScheduledActivity(+id, user).then(i => ({
      ...i,
    }))

    const attendance = await this.activitiesService.getAttendanceDetails(+attendanceId, user)

    const prisonerNumbers = [attendance.prisonerNumber]

    const attendees = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user).then(inmates =>
      inmates.map(i => ({
        name: `${this.capitalize(i.firstName)} ${this.capitalize(i.lastName)}`,
      })),
    )

    const attendee = attendees[0]

    res.render('pages/record-attendance/attendance-details', { instance, attendance, attendee })
  }

  private capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  }
}
