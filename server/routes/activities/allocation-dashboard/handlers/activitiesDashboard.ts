import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivitySummary } from '../../../../@types/activitiesAPI/types'

export default class ActivitiesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { externalActivitiesRolledOut } = user
    const { searchTerm, isOutsideWorkFilter = 'false' } = req.query as {
      searchTerm?: string
      isOutsideWorkFilter?: string
    }

    const filters = { isOutsideWorkFilter }

    const allActivities = await this.activitiesService
      .getActivities(true, user)
      .then(activity => activity.map(act => this.getCalculatedFields(act)))

    let activities = allActivities

    const searchTermValue = searchTerm?.trim().toLowerCase()

    if (searchTermValue) {
      activities = activities.filter(activity => activity.activityName.toLowerCase().includes(searchTermValue))
    }

    if (externalActivitiesRolledOut) {
      const isOutsideWork = filters.isOutsideWorkFilter === 'true'

      activities = activities.filter(activity => activity.outsideWork === isOutsideWork)
    }

    res.render('pages/activities/allocation-dashboard/activities', {
      total: this.getCalculatedFields(this.calculateTotals(activities) as ActivitySummary),
      activities,
      filters,
      searchTerm: searchTermValue,
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
