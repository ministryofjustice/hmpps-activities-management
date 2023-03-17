import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export class UncancelConfirmForm {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Please confirm you want to uncancel the session' })
  confirm: string
}

export default class UncancelSessionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/record-attendance/uncancel-session/confirm')

  POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const instanceId = +req.params.id
    const { confirm }: UncancelConfirmForm = req.body

    if (confirm === 'yes') {
      await this.activitiesService.uncancelScheduledActivity(instanceId, user)

      req.flash(
        'successMessage',
        JSON.stringify({
          message: `Session no longer cancelled`,
        }),
      )
    }

    res.redirect(`/attendance/activities/${instanceId}/attendance-list`)
  }
}
