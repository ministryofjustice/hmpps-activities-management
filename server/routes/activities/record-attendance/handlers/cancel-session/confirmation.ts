import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'

export class CancelConfirmForm {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Confirm if you want to cancel the session or not' })
  confirm: string
}

export default class CancelSessionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/record-attendance/cancel-session/confirm')

  POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const instanceId = +req.params.id
    const { confirm }: CancelConfirmForm = req.body

    if (confirm === 'yes') {
      const sessionCancellationRequest = req.journeyData.recordAttendanceJourney.sessionCancellation

      // if the reason isn't present on the request, send the user back to recollect the data
      if (!sessionCancellationRequest?.reason) return res.redirect(`../../${instanceId}/cancel`)

      const { reason, comment, issuePayment } = sessionCancellationRequest

      await this.activitiesService.cancelScheduledActivities([instanceId], reason, issuePayment, user, comment)
    }

    const redirectUrl = req.journeyData.recordAttendanceJourney.returnUrl || `../../${instanceId}/attendance-list`

    return res.redirect(redirectUrl)
  }
}
