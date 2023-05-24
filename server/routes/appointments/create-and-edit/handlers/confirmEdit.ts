import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentService from '../../../../services/editAppointmentService'

export class ConfirmEdit {
  @Expose()
  @IsEnum(YesNo, { message: 'Select yes to confirm' })
  confirm: YesNo
}

export default class ConfirmEditRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly editAppointmentService: EditAppointmentService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId, occurrenceId } = req.params

    res.render('pages/appointments/create-and-edit/confirm-edit', {
      appointmentId,
      occurrenceId,
      startDate: new Date(req.session.appointmentJourney.startDate.date),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId, occurrenceId } = req.params
    const { confirm } = req.body

    if (confirm === YesNo.YES) {
      return this.editAppointmentService.edit(req, res, req.session.editAppointmentJourney.applyTo)
    }

    return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}`)
  }
}
