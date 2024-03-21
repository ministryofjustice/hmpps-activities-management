import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

export default class ConfirmationRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity } = req.session.allocateJourney

    if (req.params.mode === 'create') {
      const allocationEvent = MetricsEvent.CREATE_ALLOCATION_JOURNEY_COMPLETED(
        req.session.allocateJourney,
        res.locals.user,
      ).addJourneyCompletedMetrics(req)
      this.metricsService.trackEvent(allocationEvent)
    }

    res.render('pages/activities/manage-allocations/confirmation', {
      activityId: activity.activityId,
      prisonerName: inmate.prisonerName,
      prisonerNumber: inmate.prisonerNumber,
      activityName: activity.name,
    })
  }
}
