import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'

export default class ActivitiesRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly capacitiesService: CapacitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const categoryId = +req.params.categoryId

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activitiesWithAllocations = await this.activitiesService
      .getActivitiesInCategory(categoryId, user)
      .then(activities =>
        Promise.all(
          activities.map(async a => ({
            ...a,
            allocationSummary: await this.capacitiesService.getActivityAllocationsSummary(a.id, user),
            schedules: await this.activitiesService.getSchedulesOfActivity(a.id, user),
          })),
        ),
      )
      // Only return activies with active schedules
      .then(activities =>
        activities.filter(a => a.schedules.findIndex(s => !s.endDate || new Date(s.endDate) >= today) >= 0),
      )

    res.render('pages/allocate-to-activity/activities-dashboard', {
      total: this.capacitiesService.getTotalAllocationSummary(activitiesWithAllocations.map(a => a.allocationSummary)),
      activities: activitiesWithAllocations,
    })
  }
}
