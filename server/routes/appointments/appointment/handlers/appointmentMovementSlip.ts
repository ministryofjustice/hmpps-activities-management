import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

export default class AppointmentMovementSlipRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    this.metricsService.trackEvent(MetricsEvent.APPOINTMENT_MOVEMENT_SLIP_PRINTED(appointment, res.locals.user))

    res.render('pages/appointments/appointment/movement-slip', { appointment })
  }
}
