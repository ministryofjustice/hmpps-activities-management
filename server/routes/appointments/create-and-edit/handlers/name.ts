import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, MaxLength } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentType } from '../appointmentJourney'
import config from '../../../../config'

export class Name {
  @Expose()
  @IsNotEmpty({ message: 'Start typing a name and select from the list' })
  categoryCode: string

  @MaxLength(40, { message: 'You must enter a custom name which has no more than 40 characters' })
  customName: string
}

export default class NameRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { type } = req.session.appointmentJourney

    const categories = await this.activitiesService.getAppointmentCategories(user).then(cat => {
      if (type === AppointmentType.SET && config.bookAVideoLinkToggleEnabled) {
        return cat.filter(c => c.code !== 'VLB')
      }
      return cat
    })

    res.render(`pages/appointments/create-and-edit/name`, { categories })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { categoryCode, customName } = req.body
    const { journeyId } = req.params
    const { user } = res.locals

    const category = await this.activitiesService
      .getAppointmentCategories(user)
      .then(categories => categories.find(c => c.code === categoryCode))

    if (!category) {
      return res.validationFailed('categoryCode', `Start typing a name and select from the list`)
    }

    req.session.appointmentJourney.category = {
      code: category.code,
      description: category.description,
    }

    if (customName?.trim()) {
      req.session.appointmentJourney.customName = customName.trim()
      req.session.appointmentJourney.appointmentName = `${req.session.appointmentJourney.customName} (${req.session.appointmentJourney.category.description})`
    } else {
      req.session.appointmentJourney.customName = null
      req.session.appointmentJourney.appointmentName = category.description
    }

    if (config.bookAVideoLinkToggleEnabled && category.code === 'VLB') {
      req.session.bookAVideoLinkJourney = {
        type: 'COURT',
        prisoners: req.session.appointmentJourney.prisoners,
      }
      req.session.appointmentJourney = null

      return res.redirect(`../../video-link-booking/create/${journeyId}/select-prisoner`)
    }

    return res.redirectOrReturn('tier')
  }
}
