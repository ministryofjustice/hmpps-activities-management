import { Request, Response } from 'express'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import config from '../../../../config'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import { AppointmentPrisonerDetails } from '../appointmentPrisonerDetails'
import AlertsService from '../../../../services/alertsService'

export default class ReviewPrisonerRoutes {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly alertsService: AlertsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId } = req.params
    const { appointmentJourney } = req.session
    const { preserveHistory } = req.query

    let backLinkHref =
      appointmentJourney.type === AppointmentType.SET ? 'upload-appointment-set' : 'how-to-add-prisoners'
    if (appointmentJourney.fromPrisonNumberProfile) {
      backLinkHref = `${config.dpsUrl}/prisoner/${appointmentJourney.fromPrisonNumberProfile}`
    }

    if (appointmentJourney.mode === AppointmentJourneyMode.EDIT) {
      const metricsEvent = MetricsEvent.APPOINTMENT_CHANGE_FROM_SCHEDULE(appointmentJourney.mode, 'attendees', user)
      this.metricsService.trackEvent(metricsEvent)
    }

    const prisoners = ReviewPrisonerRoutes.getPrisoners(req)

    res.render('pages/appointments/create-and-edit/review-prisoners', {
      appointmentId,
      backLinkHref,
      preserveHistory,
      prisoners,
      originalAppointmentId: appointmentJourney.originalAppointmentId,
    })
  }

  private static getPrisoners(req: Request): AppointmentPrisonerDetails[] {
    const { appointmentJourney, appointmentSetJourney, editAppointmentJourney } = req.session

    if (appointmentJourney.mode === AppointmentJourneyMode.EDIT) {
      return editAppointmentJourney.addPrisoners
    }
    if (appointmentJourney.type === AppointmentType.SET) {
      return appointmentSetJourney.appointments.map(appointment => appointment.prisoner)
    }
    return appointmentJourney.prisoners
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.query.preserveHistory) {
      req.session.returnTo = 'schedule?preserveHistory=true'
    }
    res.redirectOrReturn(await this.getNextPageInJourney(req, res))
  }

  private async getNextPageInJourney(req: Request, res: Response): Promise<string> {
    const prisoners = ReviewPrisonerRoutes.getPrisoners(req)
    const alertsDetails = await this.alertsService.getAlertDetails(prisoners, res.locals.user)

    if (alertsDetails.numPrisonersWithAlerts === 0) {
      if (req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT) {
        return '../../schedule'
      }
      if (req.session.appointmentJourney.mode === AppointmentJourneyMode.COPY) {
        return 'date-and-time'
      }
      return 'name'
    }
    return 'review-prisoners-alerts'
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    res.redirect(await this.getNextPageInJourney(req, res))
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    if (req.session.appointmentJourney.type === AppointmentType.SET) {
      req.session.appointmentSetJourney.appointments = req.session.appointmentSetJourney.appointments.filter(
        appointment => appointment.prisoner.number !== prisonNumber,
      )
    } else {
      req.session.appointmentJourney.prisoners = req.session.appointmentJourney.prisoners.filter(
        prisoner => prisoner.number !== prisonNumber,
      )
    }

    res.redirect(`../../review-prisoners${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }

  EDIT_REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    req.session.editAppointmentJourney.addPrisoners = req.session.editAppointmentJourney.addPrisoners.filter(
      prisoner => prisoner.number !== prisonNumber,
    )

    res.redirect('../../review-prisoners')
  }
}
