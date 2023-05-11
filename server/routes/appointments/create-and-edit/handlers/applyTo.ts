import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { EditApplyTo } from '../../../../@types/appointments'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentService from '../../../../services/editAppointmentService'

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
    private readonly editAppointmentService: EditAppointmentService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId, occurrenceId, property } = req.params

    res.render('pages/appointments/create-and-edit/apply-to', {
      appointmentId,
      occurrenceId,
      property,
      updatedPropertiesMessage: this.editAppointmentService.getUpdatedPropertiesMessage(req),
      applyToOptions: this.editAppointmentService.getApplyToOptions(req),
      startDate: new Date(req.session.appointmentJourney.startDate.date),
      isFirstRemainingOccurrence: this.editAppointmentService.isFirstRemainingOccurrence(req),
      isSecondLastRemainingOccurrence: this.editAppointmentService.isSecondLastRemainingOccurrence(req),
      isLastRemainingOccurrence: this.editAppointmentService.isLastRemainingOccurrence(req),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { applyTo } = req.body

    req.session.editAppointmentJourney.applyTo = applyTo

    await this.editAppointmentService.edit(req, res, applyTo)
  }
}
