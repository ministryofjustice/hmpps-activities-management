import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentJourney } = req.session

    res.render('pages/appointments/create-and-edit/confirmation', {
      id: req.params.id as unknown as number,
      startDate: new Date(appointmentJourney.startDate.date),
    })

    req.session.appointmentJourney = null
  }
}
