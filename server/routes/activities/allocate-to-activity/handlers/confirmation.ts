import { Request, Response } from 'express'
import { trackEvent } from '../../../../utils/eventTrackingAppInsights'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity, startDate } = req.session.allocateJourney

    res.render('pages/activities/allocate-to-activity/confirmation', {
      activityId: activity.activityId,
      prisonerName: inmate.prisonerName,
      prisonerNumber: inmate.prisonerNumber,
      activityName: activity.name,
    })

    const properties = {
      user: res.locals.user.username,
      prisonCode: res.locals.user.activeCaseLoadId,
      prisonerNumber: inmate.prisonerNumber,
      activityId: activity.activityId?.toString(),
      startDate: startDate?.toString(),
      requestDate: Date.now().toString(),
      // TODO source
    }

    const eventMetrics = {
      journeyTimeSec: (Date.now() - req.session.journeyStartTime) / 1000,
      // TODO  applicationWaitBeforeAllocationTimeDays
    }

    trackEvent({
      eventName: 'SAA-Allocation-Created',
      properties,
      eventMetrics,
    })

    req.session.allocateJourney = null
  }
}
