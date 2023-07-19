import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentType } from '../appointmentJourney'

export class Name {
  @Expose()
  @IsNotEmpty({ message: 'Start typing a name and select from the list' })
  categoryCode: string
}

export default class NameRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney } = req.session

    let backLinkHref = 'review-prisoners'
    if (appointmentJourney.type === AppointmentType.INDIVIDUAL) {
      if (appointmentJourney.prisoners?.length > 0) {
        backLinkHref = `select-prisoner?query=${appointmentJourney.prisoners[0].number}`
      } else {
        backLinkHref = 'select-prisoner'
      }
    }

    const categories = await this.activitiesService.getAppointmentCategories(user)

    res.render(`pages/appointments/create-and-edit/name`, { backLinkHref, categories })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { categoryCode } = req.body
    const { user } = res.locals

    const category = await this.activitiesService
      .getAppointmentCategories(user)
      .then(categories => categories.find(c => c.code === categoryCode))

    if (!category) {
      return res.validationFailed('categoryCode', `Start typing a name and select from the list`)
    }

    req.session.appointmentJourney.appointmentName = category.description
    req.session.appointmentJourney.category = {
      code: category.code,
      description: category.description,
    }

    return res.redirectOrReturn('description')
  }
}
