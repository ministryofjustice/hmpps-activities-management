import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/create-an-activity/confirmation')
    req.session.createJourney = null
  }
}
