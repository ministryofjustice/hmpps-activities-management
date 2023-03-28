import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'

export class Category {
  @Expose()
  @IsNotEmpty({ message: 'Select a category' })
  categoryCode: string
}

export default class CategoryRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const categories = await this.activitiesService.getAppointmentCategories(user)

    res.render(`pages/appointments/create/category`, { categories })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { categoryCode } = req.body
    const { user } = res.locals

    const category = await this.activitiesService
      .getAppointmentCategories(user)
      .then(categories => categories.find(c => c.code === categoryCode))

    if (!category) {
      req.flash('validationErrors', JSON.stringify([{ field: 'categoryCode', message: `Selected category not found` }]))
      return res.redirect('back')
    }

    req.session.createAppointmentJourney.category = {
      code: category.code,
      description: category.description,
    }

    return res.redirectOrReturn('location')
  }
}
