import { when } from 'jest-when'
import { ServiceUser } from '../@types/express'
import CapacitiesService from './capacitiesService'
import ActivitiesApiClient from '../data/activitiesApiClient'
import { ActivityCategory } from '../@types/activitiesAPI/types'

jest.mock('../data/activitiesApiClient')

describe('Capacities Service', () => {
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
  const capacitiesService = new CapacitiesService(activitiesApiClient)

  const user = { activeCaseLoadId: 'MDI' } as ServiceUser

  describe('getTotalAllocationSummary', () => {
    it('should add up all the capacities, allocation and vacancies & get a total percentage', async () => {
      const expectedResult = {
        capacity: 200,
        allocated: 130,
        percentageAllocated: 65,
        vacancies: 70,
      }

      const actualResult = await capacitiesService.getTotalAllocationSummary([
        {
          capacity: 100,
          allocated: 80,
          percentageAllocated: 80,
          vacancies: 20,
        },
        {
          capacity: 100,
          allocated: 50,
          percentageAllocated: 50,
          vacancies: 50,
        },
      ])

      expect(actualResult).toEqual(expectedResult)
    })
  })

  describe('getActivityCategoryAllocationsSummary', () => {
    it('should get the allocations summary for a category', async () => {
      when(activitiesApiClient.getCategoryCapacity)
        .calledWith('MDI', 1, user)
        .mockResolvedValue({ capacity: 50, allocated: 10 })

      const expectedResult = {
        capacity: 50,
        allocated: 10,
        percentageAllocated: 20,
        vacancies: 40,
      }

      const actualResult = await capacitiesService.getActivityCategoryAllocationsSummary(
        { id: 1 } as ActivityCategory,
        user,
      )

      expect(actualResult).toEqual(expectedResult)
    })
  })
})
