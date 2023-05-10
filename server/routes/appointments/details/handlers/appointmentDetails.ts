import { Request, Response } from 'express'

export default class AppointmentDetailsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    res.render('pages/appointments/details/appointment', { appointment })
  }
}
