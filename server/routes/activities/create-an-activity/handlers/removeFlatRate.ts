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
    const preserveHistoryString = preserveHistory ? '?preserveHistory=true' : ''

    const flatRate = req.session.createJourney.flat.findIndex(f => f.bandId === bandId)
    if (flatRate < 0) return res.redirect(`check-pay${preserveHistoryString}`)

    return res.render(`pages/activities/create-an-activity/remove-pay`, { bandId })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { choice } = req.body
    const bandId = +req.body.bandId
    const { preserveHistory } = req.query
    const preserveHistoryString = preserveHistory ? '?preserveHistory=true' : ''

    if (choice !== 'yes') {
      if (req.query && req.query.fromEditActivity) {
        return res.redirect(`/activities/schedule/check-pay${preserveHistoryString}`)
      }
      return res.redirect(`check-pay${preserveHistoryString}`)
    }

    const flatRateIndex = req.session.createJourney.flat.findIndex(f => f.bandId === bandId)

    // Not found, do nothing and redirect back
    if (flatRateIndex < 0) return res.redirect(`check-pay${preserveHistoryString}`)

    const flatRateInfo = req.session.createJourney.flat[flatRateIndex]
    req.session.createJourney.flat.splice(flatRateIndex, 1)

    if (req.query && req.query.fromEditActivity)
      return res.redirectWithSuccess(
        `/activities/schedule/check-pay${preserveHistoryString}`,
        `Flat rate ${flatRateInfo.bandAlias} removed`,
      )
    return res.redirectWithSuccess(`check-pay${preserveHistoryString}`, `Flat rate ${flatRateInfo.bandAlias} removed`)
  }
}
