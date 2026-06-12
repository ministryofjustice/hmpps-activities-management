import { Request, Response } from 'express'
import { initJourneyMetrics } from '../../../../utils/metricsUtils'

export default class StartJourneyRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    req.session.journeyMetrics = {}
    req.journeyData.createJourney = {}
    initJourneyMetrics(req)

    const url = req.session.user.externalActivitiesRolledOut ? 'activity-type' : 'category'
    // If prison is not isExternalActivitiesEnabled journey should behave as if it is in-prison
    req.journeyData.createJourney.outsideWork = false
    res.redirect(`${url}${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
