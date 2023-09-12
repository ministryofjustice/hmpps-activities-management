import { Request, Response } from 'express'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import config from '../../../../config'
import { trackEvent } from '../../../../utils/eventTrackingAppInsights'

export default class ReviewPrisonerRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params
    const { appointmentJourney } = req.session
    const { preserveHistory } = req.query

    let backLinkHref =
      appointmentJourney.type === AppointmentType.SET ? 'upload-appointment-set' : 'how-to-add-prisoners'
    if (appointmentJourney.fromPrisonNumberProfile) {
      backLinkHref = `${config.dpsUrl}/prisoner/${appointmentJourney.fromPrisonNumberProfile}`
    }

    let prisoners
    if (req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT) {
      prisoners = req.session.editAppointmentJourney.addPrisoners
      const properties = {
        username: res.locals.user.username,
        prisonCode: res.locals.user.activeCaseLoadId,
        appointmentJourneyMode: req.session.appointmentJourney.mode,
      }

      trackEvent({
        eventName: 'SAA-Appointments-Appointment-Change-From-Schedule',
        properties,
      })
    } else if (req.session.appointmentJourney.type === AppointmentType.SET) {
      prisoners = req.session.appointmentSetJourney.appointments.map(appointment => appointment.prisoner)
    } else {
      prisoners = req.session.appointmentJourney.prisoners
    }

    res.render('pages/appointments/create-and-edit/review-prisoners', {
      appointmentId,
      backLinkHref,
      preserveHistory,
      prisoners,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.query.preserveHistory) {
      req.session.returnTo = 'schedule?preserveHistory=true'
    }

    res.redirectOrReturn('name')
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    return res.redirect('../../schedule')
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
