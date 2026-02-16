import { Request, Response } from 'express'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import config from '../../../../config'
import AlertsService from '../../../../services/alertsService'

export default class ReviewPrisonersAlertsRoutes {
  constructor(private readonly alertsService: AlertsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params
    const { appointmentJourney, appointmentSetJourney } = req.session
    const { editAppointmentJourney } = req.journeyData
    const { preserveHistory } = req.query

    let backLinkHref =
      appointmentJourney.type === AppointmentType.SET ? 'upload-appointment-set' : 'how-to-add-prisoners'

    if (appointmentJourney.fromPrisonNumberProfile) {
      backLinkHref = `${config.dpsUrl}/prisoner/${appointmentJourney.fromPrisonNumberProfile}`
    }

    let prisoners
    if (appointmentJourney.mode === AppointmentJourneyMode.EDIT) {
      prisoners = editAppointmentJourney.addPrisoners
    } else if (appointmentJourney.type === AppointmentType.SET) {
      prisoners = appointmentSetJourney.appointments.map(appointment => appointment.prisoner)
    } else {
      prisoners = appointmentJourney.prisoners
    }

    const alertsDetails = prisoners.length ? await this.alertsService.getAlertDetails(prisoners) : {}

    res.render('pages/appointments/create-and-edit/review-prisoners-alerts', {
      appointmentId,
      backLinkHref,
      preserveHistory,
      alertsDetails,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.query.preserveHistory) {
      req.session.returnTo = 'schedule?preserveHistory=true'
    }

    if (req.session.appointmentJourney.mode === AppointmentJourneyMode.COPY) {
      return res.redirectOrReturn('date-and-time')
    }

    return res.redirectOrReturn('review-non-associations')
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    return res.redirectOrReturn('review-non-associations')
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

    res.redirect(`../../review-prisoners-alerts${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }

  EDIT_REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    req.journeyData.editAppointmentJourney.addPrisoners = req.journeyData.editAppointmentJourney.addPrisoners.filter(
      prisoner => prisoner.number !== prisonNumber,
    )

    res.redirect('../../review-prisoners-alerts')
  }
}
