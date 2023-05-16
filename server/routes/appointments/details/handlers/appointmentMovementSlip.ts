import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export default class AppointmentMovementSlipRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    res.render('pages/appointments/movement-slip/appointment', { movementSlip: appointment })
  }
}
