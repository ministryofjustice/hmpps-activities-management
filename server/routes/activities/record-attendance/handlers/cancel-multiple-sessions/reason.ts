import { Expose } from 'class-transformer'
import { IsIn, IsNotEmpty, MaxLength } from 'class-validator'
import { Request, Response } from 'express'
import cancellationReasons from '../../cancellationReasons'
import ActivitiesService from '../../../../../services/activitiesService'
import { convertToNumberArray } from '../../../../../utils/utils'

export class CancelReasonMultipleForm {
  @Expose()
  @IsNotEmpty({ message: "Select why you're cancelling these sessions" })
  @IsIn(Object.keys(cancellationReasons), { message: "Select why you're cancelling these sessions" })
  reason: string

  @Expose()
  @MaxLength(100, { message: 'Details must be 100 characters or less' })
  comment: string
}

export default class CancelMultipleSessionsReasonRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    res.render('pages/activities/record-attendance/cancel-multiple-sessions/cancel-reason', {
      cancellationReasons,
    })
  }

  POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { selectedInstanceIds } = req.session.recordAttendanceJourney

    const instances = await this.activitiesService.getScheduledActivities(
      convertToNumberArray(selectedInstanceIds),
      user,
    )
    const isPayable = !!instances.find(instance => instance.activitySchedule.activity.paid)

    const { reason, comment }: CancelReasonMultipleForm = req.body
    const textReason = cancellationReasons[reason]

    req.session.recordAttendanceJourney.sessionCancellationMultiple = {
      reason: textReason,
      comment,
      issuePayment: false,
    }

    if (isPayable) {
      res.redirect('payment')
    } else {
      res.redirect('check-answers')
    }
  }
}
