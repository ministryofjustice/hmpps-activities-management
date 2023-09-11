import { Request, Response } from 'express'
import { trackEvent } from '../../../../utils/eventTrackingAppInsights'

export default class BulkAppointmentMovementSlipRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentSet } = req

    appointmentSet.occurrences = appointmentSet.occurrences.filter(
      occurrence => !occurrence.isCancelled && !occurrence.isExpired,
    )

    res.render('pages/appointments/movement-slip/bulk-appointment', { appointmentSet })
    const properties = {
      username: res.locals.user.username,
      prisonCode: appointmentSet.prisonCode,
      bulkAppointmentId: appointmentSet.id.toString(),
    }

    const eventMetrics = {
      movementSlipCount: appointmentSet.occurrences.length,
    }

    trackEvent({
      eventName: 'SAA-Appointments-Movement-Slips-Printed',
      properties,
      eventMetrics,
    })
  }
}
