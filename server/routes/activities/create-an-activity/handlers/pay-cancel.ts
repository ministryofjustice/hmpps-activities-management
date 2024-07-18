import { Request, Response } from 'express'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import IncentiveLevelPayMappingUtil from '../../../../utils/helpers/incentiveLevelPayMappingUtil'

export class PayCancel {
  // @Expose()
  // @Validator(yesNo => yesNo !== undefined, {
  //   message: 'Select yes if you want to cancel the change',
  // })
  // yesNo: string
}

export default class PayCancelRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(
    private readonly prisonService: PrisonService,
    private readonly activitiesService: ActivitiesService,
  ) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { payRateType } = req.params
    const { iep, bandId, paymentStartDate, rate } = req.query
    const payBands = await this.activitiesService.getPayBandsForPrison(user)

    const band = payBands.find(p => p.id === +bandId)

    res.render(`pages/activities/create-an-activity/pay-cancel`, {
      rate,
      iep,
      paymentStartDate,
      band,
      payRateType,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // FIXME implement remove the future pay rate
    const { preserveHistory } = req.query
    res.redirect(`../check-pay${preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
