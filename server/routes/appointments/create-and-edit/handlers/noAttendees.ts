import { Request, Response } from 'express'

export default class NoAttendeesRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentJourney } = req.session

    res.render('pages/appointments/create-and-edit/no-attendees', {
      appointmentJourney,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect('how-to-add-prisoners')
  }
}
