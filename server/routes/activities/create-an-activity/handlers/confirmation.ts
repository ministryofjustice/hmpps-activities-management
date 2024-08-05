import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const activityId = req.params.id
    res.render('pages/activities/create-an-activity/confirmation', { activityId })

    req.session.createJourney = null
  }
}
