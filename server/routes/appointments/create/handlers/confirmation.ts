import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { createAppointmentJourney } = req.session

    res.render('pages/appointments/create/confirmation', {
      id: req.params.id as unknown as number,
      startDate: new Date(createAppointmentJourney.startDate.date),
    })

    req.session.createAppointmentJourney = null
  }
}
