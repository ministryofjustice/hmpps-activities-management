import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { createSingleAppointmentJourney } = req.session

    res.render('pages/appointments/create-single/confirmation', {
      id: req.params.id as unknown as number,
      confirmationMessage: `You have successfully created an appointment for ${createSingleAppointmentJourney.prisoner.displayName} on ${createSingleAppointmentJourney.startDate.display}.`,
    })
  }
}
