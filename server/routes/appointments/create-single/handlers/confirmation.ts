import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { createSingleAppointmentJourney } = req.session

    res.render('pages/appointments/create-single/confirmation', {
      id: req.params.id as unknown as number,
      confirmationMessage: `You have successfully created a ${createSingleAppointmentJourney.category.description} appointment for ${createSingleAppointmentJourney.prisoner.description} at ${createSingleAppointmentJourney.startTime.display} to ${createSingleAppointmentJourney.endTime.display} on ${createSingleAppointmentJourney.startDate.display} in the ${createSingleAppointmentJourney.location.description}.`,
    })
  }
}
