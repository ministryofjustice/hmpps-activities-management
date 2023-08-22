import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivitySummary } from '../../../../@types/activitiesAPI/types'

export default class ActivitiesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const activities = await this.activitiesService.getActivities(true, user).then(act =>
      act.map(a => ({
        ...a,
        ...this.getCalculatedFields(a),
      })),
    )

    res.render('pages/activities/allocation-dashboard/activities', {
      total: this.getCalculatedFields(this.calculateTotals(activities) as ActivitySummary),
      activities,
    })
  }

  private getCalculatedFields = (activity: ActivitySummary) => {
    const percentageAllocated = Math.floor((activity.allocated / activity.capacity) * 100)

    return {
      ...activity,
      percentageAllocated: Number.isNaN(percentageAllocated) ? 100 : percentageAllocated,
      vacancies: activity.capacity - activity.allocated,
    }
  }

  private calculateTotals = (activities: ActivitySummary[]) => {
    return activities.reduce(
      (totals, a) => ({
        capacity: totals.capacity + a.capacity,
        allocated: totals.allocated + a.allocated,
        waitlisted: totals.waitlisted + a.waitlisted,
      }),
      {
        capacity: 0,
        allocated: 0,
        waitlisted: 0,
      },
    )
  }
}
