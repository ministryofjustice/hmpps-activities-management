import { Request, Response } from 'express'
import { trackEvent } from '../../../../utils/eventTrackingAppInsights'

export default class AppointmentSetMovementSlipRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentSet } = req

    appointmentSet.appointments = appointmentSet.appointments.filter(
      appointment => !appointment.isCancelled && !appointment.isExpired,
    )

    res.render('pages/appointments/appointment-set/movement-slip', { appointmentSet })
    const properties = {
      user: res.locals.user.username,
      prisonCode: appointmentSet.prisonCode,
      appointmentSetId: appointmentSet.id.toString(),
    }

    const eventMetrics = {
      movementSlipCount: appointmentSet.appointments.length,
    }

    trackEvent({
      eventName: 'SAA-Appointment-Set-Movement-Slips-Printed',
      properties,
      eventMetrics,
    })
  }
}
