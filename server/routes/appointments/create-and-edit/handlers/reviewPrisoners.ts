import { Request, Response } from 'express'
import { AppointmentApplyTo } from '../../../../@types/appointments'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'

export default class ReviewPrisonerRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    let prisoners
    if (req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT) {
      prisoners = req.session.editAppointmentJourney.addPrisoners
    } else if (req.session.appointmentJourney.type === AppointmentType.BULK) {
      prisoners = req.session.bulkAppointmentJourney.appointments.map(appointment => appointment.prisoner)
    } else {
      prisoners = req.session.appointmentJourney.prisoners
    }

    res.render('pages/appointments/create-and-edit/review-prisoners', { prisoners })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirectOrReturn('category')
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId, occurrenceId } = req.params

    if (this.editAppointmentService.isApplyToQuestionRequired(req)) {
      return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}/edit/prisoners/add/apply-to`)
    }

    req.session.editAppointmentJourney.applyTo = AppointmentApplyTo.THIS_OCCURRENCE

    return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}/edit/prisoners/add/confirm`)
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

    res.redirect('../../review-prisoners')
  }

  EDIT_REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    req.session.editAppointmentJourney.addPrisoners = req.session.editAppointmentJourney.addPrisoners.filter(
      prisoner => prisoner.number !== prisonNumber,
    )

    res.redirect('../../review-prisoners')
  }
}
