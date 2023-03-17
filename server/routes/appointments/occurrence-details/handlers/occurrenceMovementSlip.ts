import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { MovementSlip } from '../../../../@types/appointments'

export default class OccurrenceMovementSlipRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params

    const movementSlip = (await this.activitiesService.getAppointmentOccurrenceDetails(+id, user)) as MovementSlip

    res.render('pages/appointments/movement-slip/individual', { movementSlip })
  }
}
