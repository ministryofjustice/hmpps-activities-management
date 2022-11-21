import ActivitiesApiClient from '../data/activitiesApiClient'
import { ServiceUser } from '../@types/express'
import {
  ActivityCategory,
  ActivityLite,
  ActivityScheduleLite,
  CapacityAndAllocated,
} from '../@types/activitiesAPI/types'

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

  async getScheduleAllocationsSummary(schedule: ActivityScheduleLite, user: ServiceUser): Promise<AllocationsSummary> {
    return this.activitiesApiClient.getScheduleCapacity(schedule.id, user).then(this.addCalculatedFields)
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
