import { Request, Response } from 'express'
import { trackEvent } from '../../../../utils/eventTrackingAppInsights'

export default class OccurrenceMovementSlipRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentOccurrence } = req

    res.render('pages/appointments/movement-slip/occurrence', { appointmentOccurrence })

    const properties = {
      username: res.locals.user.username,
      prisonCode: res.locals.user.activeCaseLoadId,
      appointmentId: appointmentOccurrence.appointmentId.toString(),
    }
    const eventMetrics = {
      movementSlipCount: appointmentOccurrence.prisoners.length,
    }

    trackEvent({
      eventName: 'SAA-Appointments-Movement-Slips-Printed',
      properties,
      eventMetrics,
    })
  }
}
