import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export default class AppointmentMovementSlipRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const id = parseInt(req.params.id, 10)

    const appointment = await this.activitiesService.getAppointmentDetail(id, user)

    res.render('pages/appointments/details/movement-slip', { appointment })
  }
}
