import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import { initJourneyMetrics } from '../../../../utils/metricsUtils'
import IncentiveLevelPayMappingUtil from '../../helpers/incentiveLevelPayMappingUtil'
import PrisonService from '../../../../services/prisonService'

export default class StartJourneyRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly prisonService: PrisonService, private readonly metricsService: MetricsService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney = {}
    initJourneyMetrics(req)
    this.metricsService.trackEvent(
      MetricsEvent.CREATE_ACTIVITY_JOURNEY_STARTED(res.locals.user).addJourneyStartedMetrics(req),
    )
    res.redirect(`category${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
