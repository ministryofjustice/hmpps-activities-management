import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import PrisonService from '../../../../services/prisonService'

export class PayRateType {
  @Expose()
  @IsNotEmpty({
    message:
      'Select if you want to create a pay rate for a single incentive level or a flat rate for all incentive levels',
  })
  incentiveLevel: string
}

export default class PayRateTypeRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const incentiveLevels: IncentiveLevel[] = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)

    res.render('pages/activities/create-an-activity/pay-rate-type', {
      incentiveLevels,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { incentiveLevel } = req.body
    let payRateTypeOption
    let iep

    if (incentiveLevel === 'FLAT_RATE') {
      payRateTypeOption = 'flat'
    } else {
      payRateTypeOption = 'single'
      req.session.createJourney.incentiveLevel = incentiveLevel
      if (req.params?.mode === 'edit') iep = incentiveLevel
    }
    const { preserveHistory } = req.query
    res.redirect(`pay/${payRateTypeOption}${preserveHistory ? '?preserveHistory=true' : ''}${iep ? `&iep=${iep}` : ''}`)
  }
}
