import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import ActivitiesService from '../../../services/activitiesService'

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

    const categoryName = await this.activitiesService
      .getActivityCategories(user)
      .then(categories => categories.find(c => c.id === req.body.category))
      .then(category => category.name)

    req.session.createJourney.category = {
      id: req.body.category,
      name: categoryName,
    }

    res.redirectOrReturn('name')
  }
}
