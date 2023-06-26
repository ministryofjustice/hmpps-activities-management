import { Request, Response } from 'express'

export default class BulkAppointmentDetailsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { bulkAppointment } = req

    res.render('pages/appointments/bulk-appointment-details/bulk-appointment', {
      bulkAppointment,
      showPrintMovementSlipsLink:
        bulkAppointment.occurrences.filter(occurrence => !occurrence.isCancelled && !occurrence.isExpired).length > 0,
    })
  }
}
