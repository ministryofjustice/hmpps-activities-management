import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityLite } from '../../../../@types/activitiesAPI/types'

type CapacityAndAllocated = {
  capacity: number
  allocated: number
}

export default class ActivitiesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const activities = await this.activitiesService.getActivities(true, user).then(act =>
      act.map(a => ({
        ...a,
        allocationSummary: this.addCalculatedFields(this.getCapacityAndAllocated(a)),
      })),
    )

    res.render('pages/allocation-dashboard/activities', {
      total: this.addCalculatedFields(this.calculateTotals(activities)),
      activities,
    })
  }

  private getCapacityAndAllocated = (activity: ActivityLite): CapacityAndAllocated => ({
    capacity: activity.capacity,
    allocated: activity.allocated,
  })

  private addCalculatedFields = (capacityAndAllocated: CapacityAndAllocated) => {
    const percentageAllocated = Math.floor((capacityAndAllocated.allocated / capacityAndAllocated.capacity) * 100)

    return {
      ...capacityAndAllocated,
      percentageAllocated: Number.isNaN(percentageAllocated) ? 100 : percentageAllocated,
      vacancies: capacityAndAllocated.capacity - capacityAndAllocated.allocated,
    }
  }

  private calculateTotals = (activities: ActivityLite[]): CapacityAndAllocated => {
    return activities.reduce(
      (totals, a) => ({
        capacity: totals.capacity + a.capacity,
        allocated: totals.allocated + a.allocated,
      }),
      {
        capacity: 0,
        allocated: 0,
      },
    )
  }
}
