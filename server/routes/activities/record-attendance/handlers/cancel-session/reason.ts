import { Expose } from 'class-transformer'
import { IsIn, IsNotEmpty, MaxLength } from 'class-validator'
import { Request, Response } from 'express'
import cancellationReasons from '../../cancellationReasons'

export class CancelReasonForm {
  @Expose()
  @IsNotEmpty({ message: 'Enter a reason for cancelling the session' })
  @IsIn(Object.keys(cancellationReasons), { message: 'Invalid cancellation reason' })
  reason: string

  @Expose()
  @MaxLength(250, { message: 'Details must be 250 characters or less' })
  comment: string
}

export default class CancelSessionRoutes {
  GET = async (req: Request, res: Response) =>
    res.render('pages/record-attendance/cancel-session/cancel-reason', { cancellationReasons })

  POST = async (req: Request, res: Response) => {
    const { reason, comment }: CancelReasonForm = req.body

    const textReason = cancellationReasons[reason]

    req.session.recordAttendanceRequests = {
      ...req.session.recordAttendanceRequests,
      sessionCancellation: { reason: textReason, comment },
    }

    res.redirect('cancel/confirm')
  }
}
