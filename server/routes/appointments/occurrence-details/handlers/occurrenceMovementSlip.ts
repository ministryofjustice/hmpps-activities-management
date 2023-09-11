import { Request, Response } from 'express'
import { trackEvent } from '../../../../utils/eventTrackingAppInsights'

export default class OccurrenceMovementSlipRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    res.render('pages/appointments/movement-slip/occurrence', { appointment: appointmentOccurrence })

    const properties = {
      username: res.locals.user.username,
      prisonCode: res.locals.user.activeCaseLoadId,
      appointmentId: appointment.appointmentId.toString(),
    }
    const eventMetrics = {
      movementSlipCount: appointment.prisoners.length,
    }

    trackEvent({
      eventName: 'SAA-Appointments-Movement-Slips-Printed',
      properties,
      eventMetrics,
    })
  }
}
