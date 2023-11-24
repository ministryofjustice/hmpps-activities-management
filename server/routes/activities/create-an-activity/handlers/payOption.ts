import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import PrisonService from '../../../../services/prisonService'

export class PayOptionForm {
  @Expose()
  @IsEnum(YesNo, { message: 'Select whether this activity should be paid or unpaid' })
  paid: YesNo
}

export default class PayOption {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/create-an-activity/pay-option')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { preserveHistory } = req.query
    const preserveHistoryString = preserveHistory ? '?preserveHistory=true' : ''

    req.session.createJourney.paid = req.body.paid === YesNo.YES

    if (req.body.paid !== YesNo.YES) {
      req.session.createJourney.pay = []
      req.session.createJourney.flat = []

      const minimumIncentiveLevel = await this.prisonService.getMiniamumIncentiveLevel(
        user.activeCaseLoadId,
        user,
        [],
        [],
      )
      req.session.createJourney.minimumIncentiveNomisCode = minimumIncentiveLevel.levelCode
      req.session.createJourney.minimumIncentiveLevel = minimumIncentiveLevel.levelName

      return res.redirectOrReturn('qualification')
    }

    const { pay, flat } = req.session.createJourney
    if (pay?.length > 0 || flat?.length > 0) return res.redirect(`check-pay${preserveHistoryString}`)
    return res.redirect(`pay-rate-type${preserveHistoryString}`)
  }
}
