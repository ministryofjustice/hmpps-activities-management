import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'
import atLeast from '../../../../jest.setup'
import ActivitiesRoutes from './activities'
import { ActivityLite } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/capacitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
const capacitiesService = new CapacitiesService(null) as jest.Mocked<CapacitiesService>

describe('Route Handlers - Allocation dashboard', () => {
  const handler = new ActivitiesRoutes(activitiesService, capacitiesService)
  let req: Request
  let res: Response

  const mockActivitiesData = () => {
    const maths = {
      id: 1,
      summary: 'Maths level 1',
    } as ActivityLite
    const english = {
      id: 2,
      summary: 'English level 1',
    } as ActivityLite

    activitiesService.getActivitiesInCategory.mockResolvedValue([maths, english])
    when(capacitiesService.getActivityAllocationsSummary)
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

    mockActivitiesData()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render activities with their allocation summaries', async () => {
      req.params = { categoryId: '1' }

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/activities-dashboard', {
        activities: expect.arrayContaining([
          {
            allocated: 75,
            capacity: 150,
            summary: 'English level 1',
            id: 2,
            percentageAllocated: 50,
            vacancies: 50,
          },
          {
            allocated: 80,
            capacity: 100,
            summary: 'Maths level 1',
            id: 1,
            percentageAllocated: 80,
            vacancies: 20,
          },
        ]),
        total: { allocated: 155, capacity: 250, percentageAllocated: 62, vacancies: 95 },
      })
    })
  })
})
