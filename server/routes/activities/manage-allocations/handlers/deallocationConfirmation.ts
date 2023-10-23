import { Request, Response } from 'express'

export default class DeallocationConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/deallocate-from-activity/confirmation')
    req.session.allocateJourney = null
  }
}
