import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { MaxLength, ValidateIf } from 'class-validator'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourneyMode } from '../appointmentJourney'
import { isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'
import config from '../../../../config'

export class ExtraInformation {
  @Expose()
  @MaxLength(4000, {
    message: `${config.prisonerExtraInformationEnabled ? 'You must enter notes for staff which has no more than 4,000 characters' : 'You must enter extra information which has no more than 4,000 characters'}`,
  })
  extraInformation: string

  @Expose()
  @ValidateIf(_ => config.prisonerExtraInformationEnabled)
  @MaxLength(400, { message: 'You must enter prisoner extra information which has no more than 400 characters' })
  prisonerExtraInformation: string
}

export default class ExtraInformationRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/extra-information', {
      isCtaAcceptAndSave:
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !isApplyToQuestionRequired(req.journeyData.editAppointmentJourney),
      prisoners: req.session.appointmentJourney.prisoners,
    })
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const { extraInformation, prisonerExtraInformation } = req.body

    req.session.appointmentJourney.extraInformation = extraInformation

    if (config.prisonerExtraInformationEnabled) {
      req.session.appointmentJourney.prisonerExtraInformation = prisonerExtraInformation
    }

    res.redirect(`check-answers`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { extraInformation, prisonerExtraInformation } = req.body

    req.journeyData.editAppointmentJourney.extraInformation = extraInformation

    if (config.prisonerExtraInformationEnabled) {
      req.journeyData.editAppointmentJourney.prisonerExtraInformation = prisonerExtraInformation
    }

    await this.editAppointmentService.redirectOrEdit(req, res, 'extra-information')
  }
}
