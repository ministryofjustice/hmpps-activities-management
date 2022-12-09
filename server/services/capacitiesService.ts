import ActivitiesApiClient from '../data/activitiesApiClient'
import { ServiceUser } from '../@types/express'
import { CapacityAndAllocated } from '../@types/activitiesAPI/types'
import { AllocationsSummary } from '../@types/activities'

export default class CapacitiesService {
  constructor(private readonly activitiesApiClient: ActivitiesApiClient) {}

  getTotalAllocationSummary(allocationSummaries: AllocationsSummary[]): AllocationsSummary {
    return allocationSummaries.reduce(
      (totals, c) => {
        return this.addCalculatedFields({
          capacity: totals.capacity + c.capacity,
          allocated: totals.allocated + c.allocated,
        })
      },
      {
        capacity: 0,
        allocated: 0,
        percentageAllocated: 0,
        vacancies: 0,
      },
    )
  }

  async getActivityCategoryAllocationsSummary(categoryId: number, user: ServiceUser): Promise<AllocationsSummary> {
    return this.activitiesApiClient
      .getCategoryCapacity(user.activeCaseLoadId, categoryId, user)
      .then(this.addCalculatedFields)
  }

  async getActivityAllocationsSummary(activityId: number, user: ServiceUser): Promise<AllocationsSummary> {
    return this.activitiesApiClient.getActivityCapacity(activityId, user).then(this.addCalculatedFields)
  }

  async getScheduleAllocationsSummary(scheduleId: number, user: ServiceUser): Promise<AllocationsSummary> {
    return this.activitiesApiClient.getScheduleCapacity(scheduleId, user).then(this.addCalculatedFields)
  }

  private addCalculatedFields = (capacityAndAllocated: CapacityAndAllocated) => {
    const percentageAllocated = Math.floor((capacityAndAllocated.allocated / capacityAndAllocated.capacity) * 100)

    return {
      ...capacityAndAllocated,
      percentageAllocated: Number.isNaN(percentageAllocated) ? 100 : percentageAllocated,
      vacancies: capacityAndAllocated.capacity - capacityAndAllocated.allocated,
    }
  }
}
