import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { MaxLength } from 'class-validator'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourneyMode } from '../appointmentJourney'
import { isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'
import ExtraInformationValidator from '../../../../validators/extraInformation'

export class ExtraInformation {
  @Expose()
  @MaxLength(4000, { message: 'You must enter extra information which has no more than 4,000 characters' })
  @ExtraInformationValidator({ message: 'Enter the court name and any extra information' })
  extraInformation: string
}

export default class ExtraInformationRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/extra-information', {
      isCtaAcceptAndSave:
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !isApplyToQuestionRequired(req.session.editAppointmentJourney),
    })
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const { extraInformation } = req.body

    req.session.appointmentJourney.extraInformation = extraInformation

    res.redirect(`check-answers`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { extraInformation } = req.body

    req.session.editAppointmentJourney.extraInformation = extraInformation

    await this.editAppointmentService.redirectOrEdit(req, res, 'extra-information')
  }
}
