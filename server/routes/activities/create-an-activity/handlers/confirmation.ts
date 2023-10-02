import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

export default class ConfirmationRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const metricEvent = MetricsEvent.CREATE_ACTIVITY_JOURNEY_COMPLETED(res.locals.user).addJourneyCompletedMetrics(req)
    this.metricsService.trackEvent(metricEvent)

    res.render('pages/activities/create-an-activity/confirmation', { id: req.params.id })

    req.session.createJourney = null
  }
}
