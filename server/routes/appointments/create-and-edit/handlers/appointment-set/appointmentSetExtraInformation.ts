import { Request, Response } from 'express'

export default class AppointmentSetExtraInformationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointments } = req.session.appointmentSetJourney

    res.render('pages/appointments/create-and-edit/appointment-set/extra-information', { appointments })
  }

  POST = async (req: Request, res: Response): Promise<void> => res.redirect('check-answers')
}
