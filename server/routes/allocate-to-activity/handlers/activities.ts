import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'
import { ActivityLite } from '../../../@types/activitiesAPI/types'

export default class ActivitiesRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly capacitiesService: CapacitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { categoryId } = req.params

    const addAllocationSummary = async (a: ActivityLite) => ({
      ...a,
      ...(await this.capacitiesService.getActivityAllocationsSummary(a, user)),
    })

    const activities = await this.activitiesService
      .getActivitiesInCategory(categoryId as unknown as number, user)
      .then(c => Promise.all(c.map(addAllocationSummary)))

    res.render('pages/allocate-to-activity/activities-dashboard', {
      // TODO: The sort function below can be removed when the following PR has been merged and MoJ-frontend library upgraded
      //  sorting will then be done by the client side JS
      //  https://github.com/ministryofjustice/moj-frontend/pull/406
      total: this.capacitiesService.getTotalAllocationSummary(activities),
      activities: activities.sort((a, b) => (a.summary > b.summary ? 1 : -1)),
    })
  }
}
