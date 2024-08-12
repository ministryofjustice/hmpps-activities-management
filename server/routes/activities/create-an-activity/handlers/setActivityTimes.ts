import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'

export class ActivityTimesOption {
  @Expose()
  @IsNotEmpty({ message: 'Select how to set the activity start and end times' })
  usePrisonRegimeTime: boolean
}

export default class ActivityTimesOptionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)
    res.render(`pages/activities/create-an-activity/activity-times-option`, {
      regimeTimes,
    })
  }

  // TODO
  POST = async (req: Request, res: Response): Promise<void> => {}
}
