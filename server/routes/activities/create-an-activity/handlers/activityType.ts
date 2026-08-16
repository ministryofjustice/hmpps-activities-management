import { Expose, Type } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export class ActivityType {
  @Expose()
  @Type(() => String)
  @IsNotEmpty({ message: 'Select the type of activity' })
  type: string
}

export default class ActivityTypeRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  async GET(req: Request, res: Response): Promise<void> {
    req.journeyData.createJourney.outsideWork = false
    res.render('pages/activities/create-an-activity/activity-type')
  }

  async POST(req: Request, res: Response): Promise<void> {
    const outsideWork = res.locals.user.externalActivitiesRolledOut && req.body.type === 'external'
    req.journeyData.createJourney.outsideWork = outsideWork

    if (outsideWork) {
      const category = await this.activitiesService
        .getActivityCategories(res.locals.user)
        .then(categories => categories.find(({ code }) => code === 'SAA_ROTL'))

      req.journeyData.createJourney.category = {
        id: category.id,
        code: category.code,
        name: category.name,
      }
      res.redirect('name')
      return
    }

    req.journeyData.createJourney.category = undefined
    res.redirect('category')
  }
}
