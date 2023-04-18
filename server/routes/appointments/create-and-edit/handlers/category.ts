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

    res.render(`pages/appointments/create-and-edit/category`, { categories })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { categoryCode } = req.body
    const { user } = res.locals

    const category = await this.activitiesService
      .getAppointmentCategories(user)
      .then(categories => categories.find(c => c.code === categoryCode))

    if (!category) {
      return res.validationFailed('categoryCode', `Selected category not found`)
    }

    req.session.appointmentJourney.category = {
      code: category.code,
      description: category.description,
    }

    return res.redirectOrReturn('description')
  }
}
