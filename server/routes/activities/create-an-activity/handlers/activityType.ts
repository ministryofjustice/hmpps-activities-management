import { Expose, Type } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { Request, Response } from 'express'

export class ActivityType {
  @Expose()
  @Type(() => String)
  @IsNotEmpty({ message: 'Select the type of activity' })
  type: string
}

export default class ActivityTypeRoutes {
  async GET(req: Request, res: Response): Promise<void> {
    res.render('pages/activities/create-an-activity/activity-type')
  }

  async POST(req: Request, res: Response): Promise<void> {
    req.journeyData.createJourney.activityOutsidePrison = req.body.type === 'external'
    res.redirect('category')
  }
}
