import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { AppointmentApplyTo } from '../../../../@types/appointments'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { getAppointmentApplyToOptions, getRepeatFrequencyText } from '../../../../utils/editAppointmentUtils'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

export class ApplyTo {
  @Expose()
  @IsEnum(AppointmentApplyTo, {
    message: 'Select how this change should be applied to the remaining appointments in the series',
  })
  applyTo: AppointmentApplyTo
}

export default class ApplyToRoutes {
  constructor(
    private readonly editAppointmentService: EditAppointmentService,
    private readonly metricsService: MetricsService,
  ) {}

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
    const { editAppointmentJourney } = req.session
    const { appointmentId } = req.params
    const { applyTo } = req.body

    editAppointmentJourney.applyTo = applyTo

    if (editAppointmentJourney.cancellationReason) {
      this.metricsService.trackEvent(
        MetricsEvent.CANCEL_APPOINTMENT_JOURNEY_COMPLETED(+appointmentId, req, res.locals.user),
      )
    } else {
      this.metricsService.trackEvent(
        MetricsEvent.EDIT_APPOINTMENT_JOURNEY_COMPLETED(+appointmentId, req, res.locals.user),
      )
    }

    await this.editAppointmentService.edit(req, res, applyTo)
  }
}
