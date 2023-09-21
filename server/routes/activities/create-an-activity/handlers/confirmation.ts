import { Request, Response } from 'express'
import { trackEvent } from '../../../../utils/eventTrackingAppInsights'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/confirmation', { id: req.params.id as unknown as number })

    const properties = {
      user: res.locals.user.username,
      prisonCode: res.locals.user.activeCaseLoadId,
    }
    const eventMetrics = {
      journeyTimeSec: (Date.now() - req.session.journeyStartTime) / 1000,
    }

    trackEvent({
      eventName: 'SAA-Activity-Created',
      properties,
      eventMetrics,
    })

    req.session.createJourney = null
  }
}
