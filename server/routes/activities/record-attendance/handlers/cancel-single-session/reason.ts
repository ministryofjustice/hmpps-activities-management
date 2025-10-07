import { Expose } from 'class-transformer'
import { IsIn, IsNotEmpty, MaxLength } from 'class-validator'
import { Request, Response } from 'express'
import CancellationReasons from '../../cancellationReasons'
import ActivitiesService from '../../../../../services/activitiesService'

export class CancelReasonSingleForm {
  @Expose()
  @IsNotEmpty({ message: "Select why you're cancelling this session" })
  @IsIn(Object.keys(CancellationReasons), { message: "Select why you're cancelling this session" })
  reason: string

  @Expose()
  @MaxLength(100, { message: 'Details must be 100 characters or less' })
  comment: string
}

export default class CancelSingleSessionsReasonRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const instanceId = +req.journeyData.recordAttendanceJourney.selectedInstanceIds[0]
    const instance = await this.activitiesService.getScheduledActivity(instanceId, user)
    const activityName = instance.activitySchedule.activity.summary
    const { comment, reason } = req.journeyData.recordAttendanceJourney.sessionCancellationSingle || {}

    res.render('pages/activities/record-attendance/cancel-single-session/cancel-reason', {
      activityName,
      cancellationReasons: CancellationReasons,
      comment,
      reason,
    })
  }

  POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { reason, comment }: CancelReasonSingleForm = req.body

    const instanceId = +req.journeyData.recordAttendanceJourney.selectedInstanceIds[0]
    const instance = await this.activitiesService.getScheduledActivity(instanceId, user)

    const activityName = instance.activitySchedule.activity.summary
    const isPayable = instance.activitySchedule.activity.paid
    const textReason = CancellationReasons[reason]

    req.journeyData.recordAttendanceJourney.sessionCancellationSingle = {
      activityName,
      reason: textReason,
      comment,
      issuePayment: false,
    }

    if (isPayable && !req.query.preserveHistory) {
      res.redirect('payment')
    } else {
      res.redirect('check-answers')
    }
  }
}
