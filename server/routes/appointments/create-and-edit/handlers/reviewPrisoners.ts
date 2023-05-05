import { Request, Response } from 'express'

export default class ReviewPrisonerRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/review-prisoners')
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    req.session.appointmentJourney.prisoners = req.session.appointmentJourney.prisoners.filter(
      prisoner => prisoner.number !== prisonNumber,
    )

    res.redirect('../../review-prisoners')
  }
}
