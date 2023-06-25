import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/confirmation', { id: req.params.id as unknown as number })
    req.session.createJourney = null
  }
}
