import { Request, Response } from 'express'
import _ from 'lodash'
import PrisonService from '../../../services/prisonService'
import IncentiveLevelPayMappingUtil from './helpers/incentiveLevelPayMappingUtil'

export default class CheckPayRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(req, user)

    res.render(`pages/create-an-activity/check-pay`, { incentiveLevelPays })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { pay } = req.session.createJourney

    const minimumIncentiveLevel = await this.prisonService
      .getIncentiveLevels(user.activeCaseLoadId, user)
      .then(levels => _.sortBy(levels, 'sequence'))
      .then(levels => levels.find(l => pay.find(p => p.incentiveLevel === l.iepDescription)))

    req.session.createJourney.minimumIncentiveNomisCode = minimumIncentiveLevel.iepLevel
    req.session.createJourney.minimumIncentiveLevel = minimumIncentiveLevel.iepDescription

    res.redirect(`qualification`)
  }
}
