import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

type Filters = {
  stateFilter: string
}

export default class ActivitiesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const filters = req.query as Filters
    filters.stateFilter ??= 'live'

    const activities = await this.activitiesService
      .getActivities(false, user)
      .then(act =>
        act.filter(a => filters.stateFilter === 'all' || a.activityState.toLowerCase() === filters.stateFilter),
      )

    res.render('pages/activities/manage-activities/activities-dashboard', {
      activities,
      filters,
    })
  }
}
