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
    res.render('pages/allocate-to-activity/cancel')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { activity } = req.session.allocateJourney
    const { choice } = req.body

    if (choice === 'yes') {
      req.session.allocateJourney = null
      res.redirect(`/allocation-dashboard/${activity.scheduleId}#candidates-tab`)
    } else {
      res.redirect(`check-answers`)
    }
  }
}
