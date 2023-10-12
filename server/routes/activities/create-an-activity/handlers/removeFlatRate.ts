import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'

export class ConfirmRemoveFlatOptions {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select either yes or no' })
  choice: string
}

export default class RemoveFlatRateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const bandId = +req.query.bandId
    const { preserveHistory } = req.query

    const flatRate = req.session.createJourney.flat.findIndex(f => f.prisonPayBand.id === bandId)
    if (flatRate < 0) return res.redirect(`check-pay${preserveHistory ? '?preserveHistory=true' : ''}`)

    return res.render(`pages/activities/create-an-activity/remove-pay`, { bandId })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { choice } = req.body
    const bandId = +req.body.bandId
    const { preserveHistory } = req.query
    const preserveHistoryString = preserveHistory ? '?preserveHistory=true' : ''

    if (choice !== 'yes') {
      return res.redirect(`check-pay${preserveHistoryString}`)
    }

    const flatRateIndex = req.session.createJourney.flat.findIndex(f => f.prisonPayBand.id === bandId)

    // Not found, do nothing and redirect back
    if (flatRateIndex < 0) return res.redirect(`check-pay${preserveHistoryString}`)

    const flatRateInfo = req.session.createJourney.flat[flatRateIndex]
    req.session.createJourney.flat.splice(flatRateIndex, 1)

    return res.redirectWithSuccess(
      `check-pay${preserveHistoryString}`,
      `Flat rate ${flatRateInfo.prisonPayBand.alias} removed`,
    )
  }
}
