import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'

export class ConfirmCancelOptions {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select either yes or no' })
  choice: string
}

export default class CancelRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    req.session.returnTo = req.get('Referrer')
    res.render('pages/activities/manage-allocations/cancel')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { activity } = req.session.allocateJourney
    const { choice } = req.body
    const { deallocationAfterAllocation } = req.query
    const { returnTo } = req.session
    req.session.returnTo = null

    if (choice === 'yes') {
      req.session.allocateJourney = null
      if (deallocationAfterAllocation || !activity) return res.redirect(`/activities/allocation-dashboard`)
      return res.redirect(`/activities/allocation-dashboard/${activity.activityId}`)
    }
    return res.redirect(returnTo)
  }
}
