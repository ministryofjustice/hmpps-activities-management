import { when } from 'jest-when'
import { ServiceUser } from '../@types/express'
import CapacitiesService from './capacitiesService'
import ActivitiesApiClient from '../data/activitiesApiClient'

jest.mock('../data/activitiesApiClient')

describe('Capacities Service', () => {
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
  const capacitiesService = new CapacitiesService(activitiesApiClient)

  const user = { activeCaseLoadId: 'MDI' } as ServiceUser

  describe('getTotalAllocationSummary', () => {
    it('should add up all the capacities, allocation and vacancies & get a total percentage', () => {
      const expectedResult = {
        capacity: 200,
        allocated: 130,
        percentageAllocated: 65,
        vacancies: 70,
      }

      const actualResult = capacitiesService.getTotalAllocationSummary([
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

    it('should handle division by 0', () => {
      const expectedResult = {
        capacity: 0,
        allocated: 0,
        percentageAllocated: 100,
        vacancies: 0,
      }

      const actualResult = capacitiesService.getTotalAllocationSummary([
        {
          capacity: 0,
          allocated: 0,
          percentageAllocated: 100,
          vacancies: 0,
        },
        {
          capacity: 0,
          allocated: 0,
          percentageAllocated: 100,
          vacancies: 0,
        },
      ])

      expect(actualResult).toEqual(expectedResult)
    })

    it('should handle zero allocations', () => {
      const expectedResult = {
        capacity: 100,
        allocated: 0,
        percentageAllocated: 0,
        vacancies: 100,
      }

      const actualResult = capacitiesService.getTotalAllocationSummary([
        {
          capacity: 50,
          allocated: 0,
          percentageAllocated: 0,
          vacancies: 50,
        },
        {
          capacity: 50,
          allocated: 0,
          percentageAllocated: 0,
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

      const actualResult = await capacitiesService.getActivityCategoryAllocationsSummary(1, user)

      expect(actualResult).toEqual(expectedResult)
    })

    it('should handle division by zero', async () => {
      when(activitiesApiClient.getCategoryCapacity)
        .calledWith('MDI', 1, user)
        .mockResolvedValue({ capacity: 0, allocated: 0 })

      const expectedResult = {
        capacity: 0,
        allocated: 0,
        percentageAllocated: 100,
        vacancies: 0,
      }

      const actualResult = await capacitiesService.getActivityCategoryAllocationsSummary(1, user)

      expect(actualResult).toEqual(expectedResult)
    })

    it('should handle zero allocations', async () => {
      when(activitiesApiClient.getCategoryCapacity)
        .calledWith('MDI', 1, user)
        .mockResolvedValue({ capacity: 100, allocated: 0 })

      const expectedResult = {
        capacity: 100,
        allocated: 0,
        percentageAllocated: 0,
        vacancies: 100,
      }

      const actualResult = await capacitiesService.getActivityCategoryAllocationsSummary(1, user)

      expect(actualResult).toEqual(expectedResult)
    })
  })

  describe('getActivityAllocationsSummary', () => {
    it('should get the allocations summary for an activity', async () => {
      when(activitiesApiClient.getActivityCapacity)
        .calledWith(1, user)
        .mockResolvedValue({ capacity: 50, allocated: 10 })

      const expectedResult = {
        capacity: 50,
        allocated: 10,
        percentageAllocated: 20,
        vacancies: 40,
      }

      const actualResult = await capacitiesService.getActivityAllocationsSummary(1, user)

      expect(actualResult).toEqual(expectedResult)
    })

    it('should handle division by zero', async () => {
      when(activitiesApiClient.getActivityCapacity).calledWith(1, user).mockResolvedValue({ capacity: 0, allocated: 0 })

      const expectedResult = {
        capacity: 0,
        allocated: 0,
        percentageAllocated: 100,
        vacancies: 0,
      }

      const actualResult = await capacitiesService.getActivityAllocationsSummary(1, user)

      expect(actualResult).toEqual(expectedResult)
    })

    it('should handle zero allocations', async () => {
      when(activitiesApiClient.getActivityCapacity)
        .calledWith(1, user)
        .mockResolvedValue({ capacity: 100, allocated: 0 })

      const expectedResult = {
        capacity: 100,
        allocated: 0,
        percentageAllocated: 0,
        vacancies: 100,
      }

      const actualResult = await capacitiesService.getActivityAllocationsSummary(1, user)

      expect(actualResult).toEqual(expectedResult)
    })
  })

  describe('getScheduleAllocationsSummary', () => {
    it('should get the allocations summary for an activity', async () => {
      when(activitiesApiClient.getScheduleCapacity)
        .calledWith(1, user)
        .mockResolvedValue({ capacity: 50, allocated: 10 })

      const expectedResult = {
        capacity: 50,
        allocated: 10,
        percentageAllocated: 20,
        vacancies: 40,
      }

      const actualResult = await capacitiesService.getScheduleAllocationsSummary(1, user)

      expect(actualResult).toEqual(expectedResult)
    })

    it('should handle division by zero', async () => {
      when(activitiesApiClient.getScheduleCapacity).calledWith(1, user).mockResolvedValue({ capacity: 0, allocated: 0 })

      const expectedResult = {
        capacity: 0,
        allocated: 0,
        percentageAllocated: 100,
        vacancies: 0,
      }

      const actualResult = await capacitiesService.getScheduleAllocationsSummary(1, user)

      expect(actualResult).toEqual(expectedResult)
    })

    it('should handle zero allocations', async () => {
      when(activitiesApiClient.getScheduleCapacity)
        .calledWith(1, user)
        .mockResolvedValue({ capacity: 100, allocated: 0 })

      const expectedResult = {
        capacity: 100,
        allocated: 0,
        percentageAllocated: 0,
        vacancies: 100,
      }

      const actualResult = await capacitiesService.getScheduleAllocationsSummary(1, user)

      expect(actualResult).toEqual(expectedResult)
    })
  })
})
