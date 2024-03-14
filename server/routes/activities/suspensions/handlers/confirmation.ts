import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

export default class ConfirmationRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const allocationEvent = MetricsEvent.SUSPEND_ALLOCATION_JOURNEY_COMPLETED(
      req.session.suspendJourney,
      res.locals.user,
    ).addJourneyCompletedMetrics(req)
    this.metricsService.trackEvent(allocationEvent)

    res.render('pages/activities/suspensions/confirmation')

    req.session.suspendJourney = null
  }
}
