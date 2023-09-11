import { Request, Response } from 'express'

export default class AppointmentDetailsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentSeries } = req

    res.render('pages/appointments/details/appointment', { appointmentSeries: appointment })
  }
}
