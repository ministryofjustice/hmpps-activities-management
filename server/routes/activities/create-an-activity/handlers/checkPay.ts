import { Request, Response } from 'express'
import PrisonService from '../../../../services/prisonService'
import IncentiveLevelPayMappingUtil from '../../../../utils/helpers/incentiveLevelPayMappingUtil'
import { groupPayBand } from '../../../../utils/helpers/payBandMappingUtil'

export default class CheckPayRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(this.prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { createJourney } = req.session
    const incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(
      createJourney.pay,
      createJourney.allocations,
      user,
    )
    const displayPays = groupPayBand(incentiveLevelPays)
    const flatPay = req.session.createJourney.flat

    if (req.params.mode === 'edit') {
      res.render(`pages/activities/create-an-activity/edit-pay`, { incentiveLevelPays, flatPay, displayPays })
    } else {
      res.render(`pages/activities/create-an-activity/check-pay`, { incentiveLevelPays, flatPay, displayPays })
    }
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { pay, flat } = req.session.createJourney

    if (pay.length === 0 && flat.length === 0) {
      return res.validationFailed('', `Add at least one pay rate`)
    }

    return res.redirectOrReturn(`qualification`)
  }
}
