import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { parseDate } from '../../../../utils/utils'

export default class AppointmentDetailsRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const id = parseInt(req.params.id, 10)

    const appointment = await this.activitiesService.getAppointmentDetails(id, user)

    const now = new Date()
    appointment.occurrences = appointment.occurrences.filter(
      occurrence => parseDate(`${occurrence.startDate}T${occurrence.startTime}`, "yyyy-MM-dd'T'HH:mm") >= now,
    )

    res.render('pages/appointments/details/appointment', { appointment })
  }
}
