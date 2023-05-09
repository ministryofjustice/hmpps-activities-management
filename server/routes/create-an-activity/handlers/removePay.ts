import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'

export class ConfirmRemoveOptions {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select either yes or no' })
  choice: string
}

export default class RemovePayRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { iep } = req.query
    const bandId = +req.query.bandId

    const pay = req.session.createJourney.pay.findIndex(p => p.bandId === bandId && p.incentiveLevel === iep)
    if (pay < 0) return res.redirect('check-pay')

    return res.render(`pages/create-an-activity/remove-pay`, { iep, bandId })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { iep, choice } = req.body
    const bandId = +req.body.bandId

    if (choice !== 'yes') return res.redirect('check-pay')

    const payIndex = req.session.createJourney.pay.findIndex(p => p.bandId === bandId && p.incentiveLevel === iep)

    // Not found, do nothing and redirect back
    if (payIndex < 0) return res.redirect('check-pay')

    const payInfo = req.session.createJourney.pay[payIndex]
    req.session.createJourney.pay.splice(payIndex, 1)

    return res.redirectWithSuccess(
      'check-pay',
      `${payInfo.incentiveLevel} incentive level rate ${payInfo.bandAlias} removed`,
    )
  }
}
