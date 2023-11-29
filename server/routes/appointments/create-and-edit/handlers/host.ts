import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import Organiser, { organiserDescriptions } from '../../../../enum/eventOrganisers'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourneyMode } from '../appointmentJourney'
import { isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'

export class HostForm {
  @Expose()
  @IsEnum(Organiser, { message: 'Select an appointment host' })
  host: string
}

export default class HostRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/appointments/create-and-edit/host', {
      organiserDescriptions,
      isCtaAcceptAndSave:
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !isApplyToQuestionRequired(req.session.editAppointmentJourney),
    })

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const { host }: HostForm = req.body

    req.session.appointmentJourney.organiserCode = Organiser[host]

    return res.redirectOrReturn('location')
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { host }: HostForm = req.body

    req.session.editAppointmentJourney.organiserCode = Organiser[host]

    await this.editAppointmentService.redirectOrEdit(req, res, 'host')
  }
}
