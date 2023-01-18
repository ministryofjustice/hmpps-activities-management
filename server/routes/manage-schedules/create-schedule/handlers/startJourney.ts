import { Request, Response } from 'express'

export default class StartJourneyRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    req.session.createScheduleJourney = {}
    res.redirect(`name`)
  }
}
