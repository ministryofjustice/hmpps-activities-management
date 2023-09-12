import { Request, Response } from 'express'

export default class AppointmentSeriesDetailsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentSeries } = req

    res.render('pages/appointments/appointment-series/details', { appointmentSeries })
  }
}
