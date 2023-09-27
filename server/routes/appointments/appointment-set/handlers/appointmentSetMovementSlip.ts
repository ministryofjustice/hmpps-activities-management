import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

export default class AppointmentSetMovementSlipRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentSet } = req

    appointmentSet.appointments = appointmentSet.appointments.filter(
      appointment => !appointment.isCancelled && !appointment.isExpired,
    )

    const movementSlipPrintedEvent = MetricsEvent.APPOINTMENT_SET_MOVEMENT_SLIP_PRINTED(appointmentSet, res.locals.user)
    this.metricsService.trackEvent(movementSlipPrintedEvent)

    res.render('pages/appointments/appointment-set/movement-slip', { appointmentSet })
  }
}
