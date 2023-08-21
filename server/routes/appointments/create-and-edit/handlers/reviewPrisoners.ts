import { Request, Response } from 'express'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import config from '../../../../config'
import { trackEvent } from '../../../../utils/eventTrackingAppInsights'

export default class ReviewPrisonerRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId, occurrenceId } = req.params
    const { appointmentJourney } = req.session
    const { preserveHistory } = req.query

    let backLinkHref =
      appointmentJourney.type === AppointmentType.BULK ? 'upload-bulk-appointment' : 'how-to-add-prisoners'
    if (appointmentJourney.fromPrisonNumberProfile) {
      backLinkHref = `${config.dpsUrl}/prisoner/${appointmentJourney.fromPrisonNumberProfile}`
    }

    let prisoners
    if (req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT) {
      prisoners = req.session.editAppointmentJourney.addPrisoners
    } else if (req.session.appointmentJourney.type === AppointmentType.BULK) {
      prisoners = req.session.bulkAppointmentJourney.appointments.map(appointment => appointment.prisoner)
    } else {
      prisoners = req.session.appointmentJourney.prisoners
    }

    res.render('pages/appointments/create-and-edit/review-prisoners', {
      appointmentId,
      occurrenceId,
      backLinkHref,
      preserveHistory,
      prisoners,
    })

    const properties = {
      username: res.locals.user.username,
      prisonCode: res.locals.user.activeCaseLoadId,
      property: 'Attendees',
    }
    trackEvent('SAA-Appointments-Appointment-Change-From-Schedule', properties, null)
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

    if (req.session.appointmentJourney.type === AppointmentType.BULK) {
      req.session.bulkAppointmentJourney.appointments = req.session.bulkAppointmentJourney.appointments.filter(
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
