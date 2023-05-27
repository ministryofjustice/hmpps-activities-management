import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { AppointmentCancellationReason, AppointmentApplyTo } from '../../../../@types/appointments'
import { isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'

export class CancellationReason {
  @Expose()
  @IsEnum(AppointmentCancellationReason, { message: 'Select whether to cancel or delete the appointment' })
  reason: AppointmentCancellationReason
}

export default class CancellationReasonRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId, occurrenceId } = req.params

    res.render('pages/appointments/create-and-edit/cancellation-reason', {
      appointmentId,
      occurrenceId,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId, occurrenceId } = req.params
    const { reason } = req.body

    req.session.editAppointmentJourney.cancellationReason = reason

    if (isApplyToQuestionRequired(req.session.editAppointmentJourney)) {
      return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}/edit/cancel/apply-to`)
    }

    req.session.editAppointmentJourney.applyTo = AppointmentApplyTo.THIS_OCCURRENCE

    return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}/edit/cancel/confirm`)
  }
}
