import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    res.render('pages/appointments/create-and-edit/confirmation', { appointment })

    req.session.appointmentJourney = null
  }
}
