import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'
import atLeast from '../../../../jest.setup'
import SchedulesRoutes from './schedules'
import { ActivityScheduleLite } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/capacitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
const capacitiesService = new CapacitiesService(null) as jest.Mocked<CapacitiesService>

describe('Route Handlers - Schedules dashboard', () => {
  const handler = new SchedulesRoutes(activitiesService, capacitiesService)
  let req: Request
  let res: Response

  const mockSchedulesData = () => {
    const am = {
      id: 1,
      description: 'Houseblock 1 AM',
      endDate: '2021-01-01',
    } as ActivityScheduleLite
    const pm = {
      id: 2,
      description: 'Houseblock 1 PM',
      endDate: null,
    } as ActivityScheduleLite

    activitiesService.getSchedulesOfActivity.mockResolvedValue([am, pm])
    when(capacitiesService.getScheduleAllocationsSummary)
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

    mockSchedulesData()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render active schedules with their allocation summaries', async () => {
      req.params = { activityId: '1' }

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/schedules-dashboard', {
        schedules: expect.arrayContaining([
          {
            allocated: 75,
            capacity: 150,
            description: 'Houseblock 1 PM',
            id: 2,
            percentageAllocated: 50,
            vacancies: 50,
            endDate: null,
          },
        ]),
        total: { allocated: 155, capacity: 250, percentageAllocated: 62, vacancies: 95 },
      })
    })
  })
})
