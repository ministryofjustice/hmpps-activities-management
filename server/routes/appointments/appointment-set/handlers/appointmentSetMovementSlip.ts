import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/MetricsEvent'

export default class AppointmentSetMovementSlipRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentSet } = req

    appointmentSet.appointments = appointmentSet.appointments.filter(
      appointment => !appointment.isCancelled && !appointment.isExpired,
    )

    const movementSlipPrintedEvent = new MetricsEvent('SAA-Appointment-Set-Movement-Slips-Printed', res.locals.user)
      .addProperty('appointmentSetId', appointmentSet.id)
      .addMeasurement('movementSlipCount', appointmentSet.appointments.length)
    this.metricsService.trackEvent(movementSlipPrintedEvent)

    res.render('pages/appointments/appointment-set/movement-slip', { appointmentSet })
  }
}
