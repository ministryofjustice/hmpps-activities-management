import { Request, Response } from 'express'
import { trackEvent } from '../../../../utils/eventTrackingAppInsights'

export default class BulkAppointmentMovementSlipRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { bulkAppointment } = req

    bulkAppointment.occurrences = bulkAppointment.occurrences.filter(
      occurrence => !occurrence.isCancelled && !occurrence.isExpired,
    )

    res.render('pages/appointments/movement-slip/bulk-appointment', { bulkAppointment })
    const properties = {
      username: res.locals.user.username,
      prisonCode: bulkAppointment.prisonCode,
      bulkAppointmentId: bulkAppointment.id.toString(),
    }

    const eventMetrics = {
      movementSlipCount: bulkAppointment.occurrences.length,
    }

    trackEvent({
      eventName: 'SAA-Appointments-Movement-Slips-Printed',
      properties,
      eventMetrics,
    })
  }
}
