import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { AppointmentCancellationReason } from '../../../../@types/appointments'
import { isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'

export class CancellationReason {
  @Expose()
  @IsEnum(AppointmentCancellationReason, { message: 'Select whether to cancel or delete the appointment' })
  reason: AppointmentCancellationReason
}

export default class CancellationReasonRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params

    res.render('pages/appointments/create-and-edit/cancellation-reason', {
      appointmentId,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { reason } = req.body

    req.session.editAppointmentJourney.cancellationReason = reason

    if (isApplyToQuestionRequired(req.session.editAppointmentJourney)) {
      return res.redirect('apply-to')
    }

    return res.redirect('confirm')
  }
}
