import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentService from '../../../../services/editAppointmentService'

export class ConfirmRemovePrisoner {
  @Expose()
  @IsEnum(YesNo, { message: 'Select yes to confirm removing the prisoner' })
  confirm: YesNo
}

export default class ConfirmRemovePrisonerRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly editAppointmentService: EditAppointmentService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId, occurrenceId } = req.params

    res.render('pages/appointments/create-and-edit/confirm-remove-prisoner', {
      appointmentId,
      occurrenceId,
      startDate: new Date(req.session.appointmentJourney.startDate.date),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId, occurrenceId } = req.params
    // const { confirm } = req.body

    /* if (confirm === YesNo.YES) {

    } */

    return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}`)
  }
}
