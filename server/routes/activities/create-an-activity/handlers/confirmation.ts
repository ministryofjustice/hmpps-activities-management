import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/MetricsEvent'

export default class ConfirmationRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const activityCreatedEvent = new MetricsEvent('SAA-Activity-Created', res.locals.user)
    activityCreatedEvent.setJourneyMetrics(req.session.journeyMetrics)
    this.metricsService.trackEvent(activityCreatedEvent)

    res.render('pages/activities/create-an-activity/confirmation', { id: req.params.id })

    req.session.createJourney = null
  }
}
