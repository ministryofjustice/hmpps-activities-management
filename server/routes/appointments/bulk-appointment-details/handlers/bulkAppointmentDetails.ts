import { Request, Response } from 'express'

export default class BulkAppointmentDetailsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentSet } = req

    res.render('pages/appointments/bulk-appointment-details/bulk-appointment', {
      appointmentSet,
      showPrintMovementSlipsLink:
        appointmentSet.occurrences.filter(occurrence => !occurrence.isCancelled && !occurrence.isExpired).length > 0,
    })
  }
}
