import { Request, Response } from 'express'
import _ from 'lodash'
import PrisonService from '../../../services/prisonService'
import IncentiveLevelPayMappingUtil from './helpers/incentiveLevelPayMappingUtil'
import { IepLevel } from '../../../@types/incentivesApi/types'

export default class CheckPayRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    let incentiveLevelPays = []
    incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(req, user)
    const flatPay = req.session.createJourney.flat

    res.render(`pages/create-an-activity/check-pay`, { incentiveLevelPays, flatPay })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { pay, flat } = req.session.createJourney

    if (pay.length === 0 && flat.length === 0) {
      return res.validationFailed('', `Add at least one pay rate`)
    }

    let minimumIncentiveLevel: IepLevel
    if (pay.length > 0) {
      minimumIncentiveLevel = await this.prisonService
        .getIncentiveLevels(user.activeCaseLoadId, user)
        .then(levels => _.sortBy(levels, 'sequence'))
        .then(levels => levels.find(l => pay.find(p => p.incentiveLevel === l.iepDescription)))
    } else {
      const incentiveLevels = await this.prisonService
        .getIncentiveLevels(user.activeCaseLoadId, user)
        .then(levels => _.sortBy(levels, 'sequence'))
      // eslint-disable-next-line prefer-destructuring
      minimumIncentiveLevel = incentiveLevels[0]
    }

    req.session.createJourney.minimumIncentiveNomisCode = minimumIncentiveLevel.iepLevel
    req.session.createJourney.minimumIncentiveLevel = minimumIncentiveLevel.iepDescription

    return res.redirectOrReturn(`qualification`)
  }
}
