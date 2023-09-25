import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/MetricsEvent'

export default class AppointmentMovementSlipRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    const movementSlipPrintedEvent = new MetricsEvent('SAA-Appointment-Movement-Slips-Printed', res.locals.user)
      .addProperty('appointmentId', appointment.id)
      .addMeasurement('movementSlipCount', appointment.attendees.length)
    this.metricsService.trackEvent(movementSlipPrintedEvent)

    res.render('pages/appointments/appointment/movement-slip', { appointment })
  }
}
