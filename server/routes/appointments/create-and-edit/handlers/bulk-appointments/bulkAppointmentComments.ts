import { Request, Response } from 'express'

export default class BulkAppointmentCommentsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointments } = req.session.appointmentSetJourney

    res.render('pages/appointments/create-and-edit/bulk-appointments/bulk-appointment-comments', { appointments })
  }

  POST = async (req: Request, res: Response): Promise<void> => res.redirect('check-answers')
}
