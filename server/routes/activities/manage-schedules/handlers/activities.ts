import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

type Filters = {
  categoryFilter: string
  stateFilter: string
}

export default class ActivitiesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const filters = req.query as Filters

    const [activities, categories] = await Promise.all([
      !filters.categoryFilter || filters.categoryFilter === 'all'
        ? this.activitiesService
            .getActivities(false, user)
            .then(act =>
              act.filter(
                a =>
                  !filters.stateFilter ||
                  filters.stateFilter === 'all' ||
                  a.activityState.toLowerCase() === filters.stateFilter,
              ),
            )
        : this.activitiesService
            .getActivitiesInCategory(+filters.categoryFilter, user)
            .then(act =>
              act.filter(
                a =>
                  !filters.stateFilter ||
                  filters.stateFilter === 'all' ||
                  a.activityState.toLowerCase() === filters.stateFilter,
              ),
            ),

      this.activitiesService.getActivityCategories(user),
    ])

    res.render('pages/manage-schedules/activities-dashboard', {
      activities,
      categories,
      filters,
    })
  }
}
