import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'

export class Category {
  @Expose()
  @Type(() => Number)
  @IsNotEmpty({ message: 'Select a category' })
  @IsNumber({ allowNaN: false }, { message: 'Select a category' })
  categoryId: number
}

export default class CategoryRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const categories = await this.activitiesService.getAppointmentCategories(user)

    res.render(`pages/appointments/create-single/category`, { categories })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { categoryId } = req.body
    const { user } = res.locals

    const category = await this.activitiesService
      .getAppointmentCategories(user)
      .then(categories => categories.find(c => c.id === categoryId))

    if (!category) {
      req.flash('validationErrors', JSON.stringify([{ field: 'categoryId', message: `Selected category not found` }]))
      return res.redirect('back')
    }

    req.session.createSingleAppointmentJourney.category = {
      id: category.id,
      description: category.description,
    }

    return res.redirectOrReturn('location')
  }
}
