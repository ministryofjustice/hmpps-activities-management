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
      description: 'Leisure & social',
    }
    const induction = {
      id: 2,
      description: 'Induction',
    }

    activitiesService.getActivityCategories.mockResolvedValue([leisure, induction])
    when(capacitiesService.getActivityCategoryAllocationsSummary)
      .calledWith(atLeast(leisure))
      .mockResolvedValue({
        capacity: 100,
        allocated: 80,
        percentageAllocated: 80,
        vacancies: 20,
      })
      .calledWith(atLeast(induction))
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
        categories: [
          { allocated: 75, capacity: 150, description: 'Induction', id: 2, percentageAllocated: 50, vacancies: 50 },
          {
            allocated: 80,
            capacity: 100,
            description: 'Leisure & social',
            id: 1,
            percentageAllocated: 80,
            vacancies: 20,
          },
        ],
        total: { allocated: 155, capacity: 250, percentageAllocated: 62, vacancies: 95 },
      })
    })
  })
})
