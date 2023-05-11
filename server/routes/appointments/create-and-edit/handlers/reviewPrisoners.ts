import { Request, Response } from 'express'
import { EditApplyTo } from '../../../../@types/appointments'
import EditAppointmentService from '../../../../services/editAppointmentService'

export default class ReviewPrisonerRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/review-prisoners')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirectOrReturn('category')
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId, occurrenceId } = req.params

    if (this.editAppointmentService.isApplyToQuestionRequired(req)) {
      return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}/edit/prisoners/add/apply-to`)
    }

    req.session.editAppointmentJourney.applyTo = EditApplyTo.THIS_OCCURRENCE

    return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}/edit/prisoners/add/confirm`)
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    req.session.appointmentJourney.prisoners = req.session.appointmentJourney.prisoners.filter(
      prisoner => prisoner.number !== prisonNumber,
    )

    res.redirect('../../review-prisoners')
  }
}
