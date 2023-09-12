import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { MaxLength } from 'class-validator'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourneyMode } from '../appointmentJourney'
import { getAppointmentBackLinkHref, isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'

export class Comment {
  @Expose()
  @MaxLength(4000, { message: 'You must enter extra information which has no more than 4,000 characters' })
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

    req.session.appointmentJourney.extraInformation = comment

    res.redirect(`check-answers`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { comment } = req.body

    req.session.editAppointmentJourney.extraInformation = comment

    await this.editAppointmentService.redirectOrEdit(req, res, 'comment')
  }
}
