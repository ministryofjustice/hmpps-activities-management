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
      total: this.capacitiesService.getTotalAllocationSummary(activities),
      activities,
    })
  }
}
