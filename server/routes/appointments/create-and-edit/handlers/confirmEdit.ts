import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import EditAppointmentService from '../../../../services/editAppointmentService'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

export class ConfirmEdit {
  @Expose()
  @IsEnum(YesNo, { message: 'Select yes to confirm' })
  confirm: YesNo
}

export default class ConfirmEditRoutes {
  constructor(
    private readonly editAppointmentService: EditAppointmentService,
    private readonly metricsService: MetricsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params

    res.render('pages/appointments/create-and-edit/confirm-edit', {
      appointmentId,
      startDate: new Date(req.session.appointmentJourney.startDate.date),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { editAppointmentJourney } = req.session
    const { appointmentId } = req.params
    const { confirm } = req.body

    if (editAppointmentJourney.cancellationReason) {
      this.metricsService.trackEvent(
        MetricsEvent.CANCEL_APPOINTMENT_JOURNEY_COMPLETED(+appointmentId, req, res.locals.user),
      )
    } else {
      this.metricsService.trackEvent(
        MetricsEvent.EDIT_APPOINTMENT_JOURNEY_COMPLETED(+appointmentId, req, res.locals.user),
      )
    }

    if (confirm === YesNo.YES) {
      return this.editAppointmentService.edit(req, res, editAppointmentJourney.applyTo)
    }

    return res.redirect(`/appointments/${appointmentId}`)
  }
}
