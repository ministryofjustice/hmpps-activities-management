import { Request, Response } from 'express'

export default class StartJourneyRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney = {}
    req.session.journeyMetrics = {
      journeyStartTime: Date.now(),
    }
    res.redirect(`category${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
