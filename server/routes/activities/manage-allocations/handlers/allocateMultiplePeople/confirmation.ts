import { Request, Response } from 'express'
import MetricsService from '../../../../../services/metricsService'
import MetricsEvent from '../../../../../data/metricsEvent'

export default class ConfirmMultipleAllocationsRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const allocationEvent = MetricsEvent.CREATE_MULTIPLE_ALLOCATION_JOURNEY_COMPLETED(
      req.session.allocateJourney,
      res.locals.user,
    ).addJourneyCompletedMetrics(req)
    this.metricsService.trackEvent(allocationEvent)

    res.render('pages/activities/manage-allocations/allocateMultiplePeople/confirmation')
  }
}
