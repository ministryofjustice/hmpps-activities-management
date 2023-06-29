import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourneyMode } from '../appointmentJourney'
import { getAppointmentBackLinkHref, isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'

export class Comment {
  @Expose()
  comment: string
}

export default class CommentRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/comment', {
      backLinkHref: getAppointmentBackLinkHref(req, 'schedule'),
      isCtaAcceptAndSave:
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !isApplyToQuestionRequired(req.session.editAppointmentJourney),
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
