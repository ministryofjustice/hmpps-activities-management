import { Expose } from 'class-transformer'
import { IsIn, IsNotEmpty, MaxLength } from 'class-validator'
import { Request, Response } from 'express'
import cancellationReasons from '../../cancellationReasons'
import ActivitiesService from '../../../../../services/activitiesService'

export class CancelReasonForm {
  @Expose()
  @IsNotEmpty({ message: "Select why you're cancelling the session" })
  @IsIn(Object.keys(cancellationReasons), { message: "Select why you're cancelling the session" })
  reason: string

  @Expose()
  @MaxLength(100, { message: 'Details must be 100 characters or less' })
  comment: string
}

export default class CancelSessionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const instanceId = req.params.id

    const instance = await this.activitiesService.getScheduledActivity(+instanceId, user)
    const isPayable = instance.activitySchedule.activity.paid

    res.render('pages/activities/record-attendance/cancel-session/cancel-reason', {
      cancellationReasons,
      isPayable,
    })
  }

  POST = async (req: Request, res: Response) => {
    const { reason, comment }: CancelReasonForm = req.body

    const textReason = cancellationReasons[reason]

    req.session.recordAttendanceJourney = {
      ...req.session.recordAttendanceJourney,
      sessionCancellation: { reason: textReason, comment },
    }

    res.redirect('cancel/confirm')
  }
}
