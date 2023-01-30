import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'

export default class ActivityRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId } = req.params

    const activity = await this.activitiesService.getActivity(activityId as unknown as number, user)

    res.render('pages/manage-schedules/check-answers', {
      activity,
    })
  }
}
