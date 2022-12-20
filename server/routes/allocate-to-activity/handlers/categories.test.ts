import { Request, Response } from 'express'

import { when } from 'jest-when'
import CategoriesRoutes from './categories'
import ActivitiesService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'
import atLeast from '../../../../jest.setup'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/capacitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
const capacitiesService = new CapacitiesService(null) as jest.Mocked<CapacitiesService>

describe('Route Handlers - Categories dashboard', () => {
  const handler = new CategoriesRoutes(activitiesService, capacitiesService)
  let req: Request
  let res: Response

  const mockCategoriesData = () => {
    const leisure = {
      id: 1,
      name: 'Leisure & social',
      description: 'Such as association, library time and social clubs, like music or art',
      code: 'X',
    }
    const induction = {
      id: 2,
      name: 'Induction',
      description: 'Such as gym induction, education assessments, health and safety workshops',
      code: 'Y',
    }

    activitiesService.getActivityCategories.mockResolvedValue([leisure, induction])
    when(capacitiesService.getActivityCategoryAllocationsSummary)
      .calledWith(atLeast(1))
      .mockResolvedValue({
        capacity: 100,
        allocated: 80,
        percentageAllocated: 80,
        vacancies: 20,
      })
      .calledWith(atLeast(2))
      .mockResolvedValue({
        capacity: 150,
        allocated: 75,
        percentageAllocated: 50,
        vacancies: 50,
      })
    capacitiesService.getTotalAllocationSummary.mockReturnValue({
      capacity: 250,
      allocated: 155,
      percentageAllocated: 62,
      vacancies: 95,
    })
  }

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
    } as unknown as Response

    req = {} as unknown as Request

    mockCategoriesData()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render categories with their allocation summaries', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/categories-dashboard', {
        categories: expect.arrayContaining([
          {
            allocated: 75,
            capacity: 150,
            name: 'Induction',
            description: 'Such as gym induction, education assessments, health and safety workshops',
            id: 2,
            code: 'Y',
            percentageAllocated: 50,
            vacancies: 50,
          },
          {
            allocated: 80,
            capacity: 100,
            name: 'Leisure & social',
            description: 'Such as association, library time and social clubs, like music or art',
            id: 1,
            code: 'X',
            percentageAllocated: 80,
            vacancies: 20,
          },
        ]),
        total: { allocated: 155, capacity: 250, percentageAllocated: 62, vacancies: 95 },
      })
    })
  })
})
