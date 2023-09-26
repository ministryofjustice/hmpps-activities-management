import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/MetricsEvent'

export default class ConfirmationRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity } = req.session.allocateJourney

    const allocationEvent = new MetricsEvent('SAA-Allocation-Created', res.locals.user)
    allocationEvent.setAllocation(req.session.allocateJourney)
    allocationEvent.setJourneyMetrics(req.session.journeyMetrics)
    allocationEvent.addProperty('requestDate', Date.now())
    this.metricsService.trackEvent(allocationEvent)

    res.render('pages/activities/allocate-to-activity/confirmation', {
      activityId: activity.activityId,
      prisonerName: inmate.prisonerName,
      prisonerNumber: inmate.prisonerNumber,
      activityName: activity.name,
    })

    req.session.allocateJourney = null
  }
}
