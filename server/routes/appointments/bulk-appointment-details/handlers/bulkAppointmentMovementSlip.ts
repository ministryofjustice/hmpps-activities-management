import { Request, Response } from 'express'

export default class BulkAppointmentMovementSlipRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { bulkAppointment } = req

    bulkAppointment.occurrences = bulkAppointment.occurrences.filter(
      occurrence => !occurrence.isCancelled && !occurrence.isExpired,
    )

    res.render('pages/appointments/movement-slip/bulk-appointment', { bulkAppointment })
  }
}
