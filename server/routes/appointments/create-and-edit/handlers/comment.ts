import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourneyMode } from '../appointmentJourney'
import { YesNo } from '../../../../@types/activities'

export class Comment {
  @Expose()
  comment: string
}

export default class CommentRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const defaultBackLinkHref =
      req.session.appointmentJourney.repeat === YesNo.YES ? 'repeat-period-and-count' : 'repeat'

    res.render('pages/appointments/create-and-edit/comment', {
      backLinkHref: this.editAppointmentService.getBackLinkHref(req, defaultBackLinkHref),
      isCtaAcceptAndSave:
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !this.editAppointmentService.isApplyToQuestionRequired(req),
    })
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const { comment } = req.body

    req.session.appointmentJourney.comment = comment

    res.redirect(`check-answers`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { comment } = req.body

    req.session.editAppointmentJourney.comment = comment

    await this.editAppointmentService.redirectOrEdit(req, res, 'comment')
  }
}
