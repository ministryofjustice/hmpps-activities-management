import { Request, Response } from 'express'
import _ from 'lodash'
import PrisonService from '../../../services/prisonService'
import IncentiveLevelPayMappingUtil from './helpers/incentiveLevelPayMappingUtil'
import { CreateAnActivityJourney } from '../journey'

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

    const incentiveLevels = await this.prisonService
      .getIncentiveLevels(user.activeCaseLoadId, user)
      .then(levels => _.sortBy(levels, 'sequence'))

    req.session.createJourney.minimumIncentiveNomisCode = incentiveLevels.find(l =>
      pay.find(p => p.incentiveLevel === l.iepDescription),
    ).iepLevel

    req.session.createJourney.minimumIncentiveLevel = incentiveLevels.find(l =>
      pay.find(p => p.incentiveLevel === l.iepDescription),
    ).iepDescription

    const newActivity: Partial<CreateAnActivityJourney> = {}
    newActivity.pay = []

    req.session.createJourney.pay.map(s1 =>
      newActivity.pay.push({
        incentiveNomisCode: incentiveLevels.find(s2 => s2.iepDescription === s1.incentiveLevel).iepLevel,
        incentiveLevel: s1.incentiveLevel,
        bandId: s1.bandId,
        bandAlias: s1.bandAlias,
        displaySequence: s1.displaySequence,
        rate: s1.rate,
      }),
    )

    req.session.createJourney.pay = newActivity.pay

    res.redirect(`check-answers`)
  }
}
