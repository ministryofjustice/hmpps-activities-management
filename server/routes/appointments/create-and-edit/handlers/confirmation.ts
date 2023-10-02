import { Request, Response } from 'express'
import MetricsEvent from '../../../../data/metricsEvent'
import MetricsService from '../../../../services/metricsService'

export default class ConfirmationRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    this.metricsService.trackEvent(MetricsEvent.CREATE_APPOINTMENT_JOURNEY_COMPLETED(appointment, req, res.locals.user))

    res.render('pages/appointments/create-and-edit/confirmation', { appointment })

    req.session.appointmentJourney = null
    req.session.journeyMetrics = null
  }

  GET_SET = async (req: Request, res: Response) => {
    const { appointmentSet } = req

    this.metricsService.trackEvent(
      MetricsEvent.CREATE_APPOINTMENT_SET_JOURNEY_COMPLETED(appointmentSet, req, res.locals.user),
    )

    res.render('pages/appointments/create-and-edit/confirmation', { appointmentSet })

    req.session.appointmentJourney = null
    req.session.appointmentSetJourney = null
    req.session.journeyMetrics = null
  }
}
