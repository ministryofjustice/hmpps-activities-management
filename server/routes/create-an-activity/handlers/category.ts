import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import ActivitiesService from '../../../services/activitiesService'
import { ActivityUpdateRequest } from '../../../@types/activitiesAPI/types'

export class Category {
  @Expose()
  @Type(() => Number)
  @IsNotEmpty({ message: 'Select a category' })
  @IsNumber({ allowNaN: false }, { message: 'Select a category' })
  category: number
}

export default class CategoryRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const categories = await this.activitiesService.getActivityCategories(user)

    res.render(`pages/create-an-activity/category`, { categories })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const category = await this.activitiesService
      .getActivityCategories(user)
      .then(categories => categories.find(c => c.id === req.body.category))

    req.session.createJourney.category = {
      id: req.body.category,
      code: category.code,
      name: category.name,
    }

    if (req.query && req.query.fromEditActivity) {
      const { activityId } = req.session.createJourney
      const prisonCode = user.activeCaseLoadId
      const activity = {
        categoryId: req.session.createJourney.category.id,
      } as ActivityUpdateRequest

      await this.activitiesService.updateActivity(prisonCode, activityId, activity)
      const successMessage = `We've updated the category for ${req.session.createJourney.name}`

      const returnTo = `/activities/schedule/activities/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    } else {
      // If the category is not in work, default to in-cell activity location
      if (category.code === 'SAA_NOT_IN_WORK' && !req.session.createJourney.location) {
        req.session.createJourney.inCell = true
      }

      res.redirectOrReturn('name')
    }
  }
}
