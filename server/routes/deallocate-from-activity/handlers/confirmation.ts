import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { deallocateJourney } = req.session
    res.render('pages/deallocate-from-activity/confirmation', { deallocateJourney })
    req.session.deallocateJourney = null
  }
}
