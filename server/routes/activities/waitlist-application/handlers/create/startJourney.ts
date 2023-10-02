import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import PrisonService from '../../../../../services/prisonService'
import { convertToTitleCase } from '../../../../../utils/utils'
import { initJourneyMetrics } from '../../../../../utils/metricsUtils'
import MetricsService from '../../../../../services/metricsService'
import MetricsEvent from '../../../../../data/metricsEvent'

export default class StartJourneyRoutes {
  constructor(private readonly prisonService: PrisonService, private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)

    if (prisoner.prisonId !== user.activeCaseLoadId) {
      return next(createHttpError.NotFound())
    }

    req.session.waitListApplicationJourney = {
      prisoner: {
        prisonerNumber,
        name: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
      },
    }
    initJourneyMetrics(req)
    this.metricsService.trackEvent(
      MetricsEvent.WAITLIST_APPLICATION_JOURNEY_STARTED(res.locals.user).addJourneyStartedMetrics(req),
    )

    return res.redirect(`../request-date`)
  }
}
