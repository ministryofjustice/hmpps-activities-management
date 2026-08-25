import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, MaxLength } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentType } from '../appointmentJourney'
import MetricsService from '../../../../services/metricsService'
import { initJourneyMetrics } from '../../../../utils/metricsUtils'
import MetricsEvent from '../../../../data/metricsEvent'

export class Name {
  @Expose()
  @IsNotEmpty({ message: 'Start typing a name and select from the list' })
  categoryCode: string

  @MaxLength(40, { message: 'You must enter a custom name which has no more than 40 characters' })
  customName: string
}

export default class NameRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly metricsService: MetricsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney } = req.journeyData
    const { type } = appointmentJourney

    if (appointmentJourney.fromAppointmentConfirmation) {
      initJourneyMetrics(req, 'appointmentConfirmation')
      this.metricsService.trackEvent(MetricsEvent.CREATE_APPOINTMENT_JOURNEY_STARTED(req, user))
      delete appointmentJourney.fromAppointmentConfirmation
    }

    const categories = (
      await this.activitiesService.getAppointmentCategories(user).then(cat => {
        if (type === AppointmentType.SET) {
          return cat.filter(c => c.code !== 'VLB' && c.code !== 'VLPM')
        }
        return cat
      })
    ).sort((a, b) => a.description.localeCompare(b.description))

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

    req.journeyData.appointmentJourney.category = {
      code: category.code,
      description: category.description,
    }

    if (customName?.trim()) {
      req.journeyData.appointmentJourney.customName = customName.trim()
      req.journeyData.appointmentJourney.appointmentName = `${req.journeyData.appointmentJourney.customName} (${req.journeyData.appointmentJourney.category.description})`
    } else {
      req.journeyData.appointmentJourney.customName = null
      req.journeyData.appointmentJourney.appointmentName = category.description
    }

    if (category.code === 'VLB') {
      req.session.bookACourtHearingJourney = {
        prisoners: req.journeyData.appointmentJourney.prisoners,
      }
      req.journeyData.appointmentJourney = null

      return res.redirect(`../../video-link-booking/court/create/${journeyId}/select-prisoner`)
    }

    if (category.code === 'VLPM') {
      req.session.bookAProbationMeetingJourney = {
        prisoners: req.journeyData.appointmentJourney.prisoners,
      }
      req.journeyData.appointmentJourney = null

      return res.redirect(`../../video-link-booking/probation/create/${journeyId}/select-prisoner`)
    }

    return res.redirectOrReturn('tier')
  }
}
