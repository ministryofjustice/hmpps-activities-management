import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentApplyTo } from '../../../../@types/appointments'

export class ConfirmEdit {
  @Expose()
  @IsEnum(YesNo, { message: 'Select yes to confirm' })
  confirm: YesNo
}

export default class ConfirmEditRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params

    res.render('pages/appointments/create-and-edit/confirm-edit', {
      appointmentId,
      startDate: new Date(req.session.appointmentJourney.startDate.date),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params
    const { confirm } = req.body

    if (confirm === YesNo.YES) {
      return this.editAppointmentService.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)
    }

    return res.redirect(`/appointments/${appointmentId}`)
  }
}
