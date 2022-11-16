import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'
import { ActivityCategory } from '../../../@types/activitiesAPI/types'

export default class CategoriesRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly capacitiesService: CapacitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const addAllocationSummary = async (c: ActivityCategory) => ({
      ...c,
      ...(await this.capacitiesService.getActivityCategoryAllocationsSummary(c, user)),
    })

    const categories = await this.activitiesService
      .getActivityCategories(user)
      .then(c => Promise.all(c.map(addAllocationSummary)))

    res.render('pages/allocate-to-activity/categories-dashboard', {
      total: this.capacitiesService.getTotalAllocationSummary(categories),
      categories,
    })
  }
}
