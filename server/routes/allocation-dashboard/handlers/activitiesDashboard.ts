import { Request, Response } from 'express'
import { startOfToday } from 'date-fns'
import ActivitiesService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'

export default class ActivitiesRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly capacitiesService: CapacitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const today = startOfToday()

    const activities = await this.activitiesService.getActivities(user)

    const activitiesWithAllocations = await Promise.all(
      activities.map(async a => ({
        ...a,
        allocationSummary: await this.capacitiesService.getActivityAllocationsSummary(a.id, user),
        schedules: await this.activitiesService.getSchedulesOfActivity(a.id, user),
      })),
    ).then(a => a.filter(p => p.schedules.findIndex(s => !s.endDate || new Date(s.endDate) >= today) >= 0))

    res.render('pages/allocation-dashboard/activities', {
      total: this.capacitiesService.getTotalAllocationSummary(activitiesWithAllocations.map(a => a.allocationSummary)),
      activities: activitiesWithAllocations,
    })
  }
}
