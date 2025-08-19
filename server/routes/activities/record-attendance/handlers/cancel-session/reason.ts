import { Expose } from 'class-transformer'
import { IsIn, IsNotEmpty, MaxLength } from 'class-validator'
import { Request, Response } from 'express'
import CancellationReasons from '../../cancellationReasons'
import ActivitiesService from '../../../../../services/activitiesService'

export class CancelReasonForm {
  @Expose()
  @IsNotEmpty({ message: "Select why you're cancelling the session" })
  @IsIn(Object.keys(CancellationReasons), { message: "Select why you're cancelling the session" })
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
    const { editMode } = req.query

    const instance = await this.activitiesService.getScheduledActivity(+instanceId, user)
    const isPayable = instance.activitySchedule.activity.paid

    res.render('pages/activities/record-attendance/cancel-session/cancel-reason', {
      cancellationReasons: CancellationReasons,
      isPayable,
      editMode: editMode || false,
      instanceId,
    })
  }

  POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { editMode } = req.query
    const { reason, comment }: CancelReasonForm = req.body
    const instanceId = +req.params.id

    const textReason = CancellationReasons[reason]

    if (editMode) {
      const updatedReason = {
        cancelledReason: textReason,
        comment,
      }
      await this.activitiesService.updateCancelledSession(instanceId, updatedReason, user)
      const successMessage = `You've updated the reason for cancelling this session`
      const returnTo = `../cancel-multiple/view-edit-details/${instanceId}?detailsEdited=true`
      req.session.returnTo = returnTo
      return res.redirectOrReturnWithSuccess(returnTo, 'Session updated', successMessage)
    }

    req.journeyData.recordAttendanceJourney = {
      ...req.journeyData.recordAttendanceJourney,
      sessionCancellation: { reason: textReason, comment },
    }
    return res.redirect('cancel/confirm')
  }
}
