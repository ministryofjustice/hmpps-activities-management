import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export default class OccurrenceDetailsRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const id = parseInt(req.params.id, 10)

    const occurrence = await this.activitiesService.getAppointmentOccurrenceDetails(id, user)

    res.render('pages/appointments/occurrence-details/occurrence', { occurrence })
  }
}
