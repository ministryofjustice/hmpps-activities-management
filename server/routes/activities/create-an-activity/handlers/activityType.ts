import { Expose, Type } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityCategoryEnum } from '../../../../data/activityCategoryEnum'

export class ActivityType {
  @Expose()
  @Type(() => String)
  @IsNotEmpty({ message: 'Select the type of activity' })
  type: string
}

export default class ActivityTypeRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    req.journeyData.createJourney.outsideWork = false
    res.render('pages/activities/create-an-activity/activity-type')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const outsideWork = res.locals.user.externalActivitiesRolledOut && req.body.type === 'external'
    req.journeyData.createJourney.outsideWork = outsideWork

    if (outsideWork) {
      const category = await this.activitiesService
        .getActivityCategories(res.locals.user)
        .then(categories => categories.find(({ code }) => code === ActivityCategoryEnum.SAA_ROTL))

      if (!category) {
        throw new Error(`Activity category ${ActivityCategoryEnum.SAA_ROTL} not found`)
      }

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
