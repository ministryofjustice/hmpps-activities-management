import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import { initJourneyMetrics } from '../../../../utils/metricsUtils'

export default class StartJourneyRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney = {}
    initJourneyMetrics(req)
    this.metricsService.trackEvent(
      MetricsEvent.CREATE_ACTIVITY_JOURNEY_STARTED(res.locals.user).addJourneyStartedMetrics(req),
    )
    res.redirect(`category${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
