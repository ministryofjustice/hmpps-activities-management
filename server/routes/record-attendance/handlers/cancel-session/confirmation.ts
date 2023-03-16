import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export class CancelConfirmForm {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Please confirm you want to cancel the session' })
  confirm: string
}

export default class CancelSessionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/record-attendance/cancel-session/confirm')

  POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const instanceId = +req.params.id
    const { confirm }: CancelConfirmForm = req.body

    if (confirm === 'yes') {
      const sessionCancellationRequest = req.session.recordAttendanceRequests.sessionCancellation
      await this.activitiesService.cancelScheduledActivity(instanceId, sessionCancellationRequest, user)
    }

    res.redirect(`/attendance/activities/${instanceId}/attendance-list`)
  }
}
