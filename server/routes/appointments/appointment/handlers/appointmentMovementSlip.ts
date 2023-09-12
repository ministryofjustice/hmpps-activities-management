import { Request, Response } from 'express'
import { trackEvent } from '../../../../utils/eventTrackingAppInsights'

export default class AppointmentMovementSlipRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    res.render('pages/appointments/appointment/movement-slip', { appointment })

    const properties = {
      username: res.locals.user.username,
      prisonCode: res.locals.user.activeCaseLoadId,
      appointmentId: appointment.id.toString(),
    }
    const eventMetrics = {
      movementSlipCount: appointment.attendees.length,
    }

    trackEvent({
      eventName: 'SAA-Appointment-Movement-Slips-Printed',
      properties,
      eventMetrics,
    })
  }
}
