import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/confirmation', { id: req.params.id })

    req.session.createJourney = null
  }
}
