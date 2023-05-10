import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { EditApplyTo } from '../../../../@types/appointments'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentUtils from '../../../../utils/helpers/editAppointmentUtils'

export class ApplyTo {
  @Expose()
  @IsEnum(EditApplyTo, {
    message: 'Select how this change should be applied to the remaining appointments in the series',
  })
  applyTo: EditApplyTo
}

export default class ApplyToRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly editAppointmentUtils: EditAppointmentUtils,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentJourney } = req.session
    const { appointmentId, occurrenceId, property } = req.params

    const applyToOptions = this.editAppointmentUtils.getApplyToOptions(appointmentJourney)

    res.render('pages/appointments/create-and-edit/apply-to', {
      appointmentId,
      occurrenceId,
      property,
      applyToOptions,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney } = req.session
    const { appointmentId, occurrenceId, property } = req.params
    const { applyTo } = req.body

    await this.editAppointmentUtils.edit(
      +appointmentId,
      +occurrenceId,
      appointmentJourney,
      property,
      applyTo,
      user,
      res,
    )
  }
}
