import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { AppointmentApplyTo } from '../../../../@types/appointments'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { getAppointmentApplyToOptions, getRepeatFrequencyText } from '../../../../utils/editAppointmentUtils'

export class ApplyTo {
  @Expose()
  @IsEnum(AppointmentApplyTo, {
    message: 'Select how this change should be applied to the remaining appointments in the series',
  })
  applyTo: AppointmentApplyTo
}

export default class ApplyToRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId, property } = req.params
    const { appointmentJourney } = req.session

    res.render('pages/appointments/create-and-edit/apply-to', {
      appointmentId,
      property,
      applyToOptions: getAppointmentApplyToOptions(req),
      frequencyText: getRepeatFrequencyText(appointmentJourney),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { applyTo } = req.body

    await this.editAppointmentService.edit(req, res, applyTo)
  }
}
