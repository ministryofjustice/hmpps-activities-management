import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export default class AppointmentMovementSlipRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params

    const appointment = await this.activitiesService.getAppointmentDetails(+id, user)

    res.render('pages/appointments/details/movement-slip', { appointment })
  }
}
