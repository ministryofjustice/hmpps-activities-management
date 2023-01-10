import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'

export default class ActivitiesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const activities = await this.activitiesService.getActivities(user)
    res.render('pages/manage-schedules/activities-dashboard', {
      activities,
    })
  }
}
