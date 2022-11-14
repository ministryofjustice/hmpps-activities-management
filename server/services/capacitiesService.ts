import ActivitiesApiClient from '../data/activitiesApiClient'
import { ServiceUser } from '../@types/express'
import { ActivityCategory, ActivityLite, CapacityAndAllocated } from '../@types/activitiesAPI/types'

type AllocationsSummary = {
  capacity: number
  allocated: number
  percentageAllocated: number
  vacancies: number
}

export default class CapacitiesService {
  constructor(private readonly activitiesApiClient: ActivitiesApiClient) {}

  getTotalAllocationSummary(allocationSummaries: AllocationsSummary[]): AllocationsSummary {
    return allocationSummaries.reduce(
      (totals, c) => ({
        capacity: totals.capacity + c.capacity,
        allocated: totals.allocated + c.allocated,
        percentageAllocated:
          Math.floor(((totals.allocated + c.allocated) / (totals.capacity + c.capacity)) * 100) || 100,
        vacancies: totals.vacancies + c.vacancies,
      }),
      {
        capacity: 0,
        allocated: 0,
        percentageAllocated: 0,
        vacancies: 0,
      },
    )
  }

  async getActivityCategoryAllocationsSummary(
    category: ActivityCategory,
    user: ServiceUser,
  ): Promise<AllocationsSummary> {
    return this.activitiesApiClient
      .getCategoryCapacity(user.activeCaseLoadId, category.id, user)
      .then(this.addCalculatedFields)
  }

  async getActivityAllocationsSummary(activity: ActivityLite, user: ServiceUser): Promise<AllocationsSummary> {
    return this.activitiesApiClient.getActivityCapacity(activity.id, user).then(this.addCalculatedFields)
  }

  private addCalculatedFields = (capacityAndAllocated: CapacityAndAllocated) => ({
    ...capacityAndAllocated,
    percentageAllocated: Math.floor((capacityAndAllocated.allocated / capacityAndAllocated.capacity) * 100) || 100,
    vacancies: capacityAndAllocated.capacity - capacityAndAllocated.allocated,
  })
}
