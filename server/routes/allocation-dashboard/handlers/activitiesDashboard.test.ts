import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'
import atLeast from '../../../../jest.setup'
import ActivitiesRoutes from './activitiesDashboard'
import { ActivityLite, ActivityScheduleLite } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/capacitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
const capacitiesService = new CapacitiesService(null) as jest.Mocked<CapacitiesService>

describe('Route Handlers - Allocation dashboard', () => {
  const handler = new ActivitiesRoutes(activitiesService, capacitiesService)
  let req: Request
  let res: Response

  const scheduleAm = {
    id: 1,
    description: 'Houseblock 1 AM',
    endDate: '2021-01-01',
  } as ActivityScheduleLite
  const schedulePm = {
    id: 2,
    description: 'Houseblock 1 PM',
    endDate: null,
  } as ActivityScheduleLite

  const mockActivitiesData = () => {
    const maths = {
      id: 1,
      summary: 'Maths level 1',
    } as ActivityLite
    const english = {
      id: 2,
      summary: 'English level 1',
    } as ActivityLite

    when(activitiesService.getActivities).mockResolvedValue([maths, english])
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

    when(capacitiesService.getTotalAllocationSummary).mockReturnValue({
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

    req = {
      params: { categoryId: '1' },
    } as unknown as Request

    mockActivitiesData()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render activities with their allocation summaries', async () => {
      when(activitiesService.getSchedulesOfActivity).mockResolvedValue([scheduleAm, schedulePm])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/allocation-dashboard/activities', {
        activities: expect.arrayContaining([
          {
            summary: 'English level 1',
            id: 2,
            allocationSummary: {
              allocated: 75,
              capacity: 150,
              percentageAllocated: 50,
              vacancies: 50,
            },
            schedules: [
              {
                id: 1,
                description: 'Houseblock 1 AM',
                endDate: '2021-01-01',
              },
              {
                id: 2,
                description: 'Houseblock 1 PM',
                endDate: null,
              },
            ],
          },
          {
            summary: 'Maths level 1',
            id: 1,
            allocationSummary: {
              allocated: 80,
              capacity: 100,
              percentageAllocated: 80,
              vacancies: 20,
            },
            schedules: [
              {
                id: 1,
                description: 'Houseblock 1 AM',
                endDate: '2021-01-01',
              },
              {
                id: 2,
                description: 'Houseblock 1 PM',
                endDate: null,
              },
            ],
          },
        ]),
        total: { allocated: 155, capacity: 250, percentageAllocated: 62, vacancies: 95 },
      })
    })

    it('should not render activities without active an schedule', async () => {
      when(activitiesService.getSchedulesOfActivity)
        .calledWith(atLeast(1))
        .mockResolvedValueOnce([scheduleAm, schedulePm])

      when(activitiesService.getSchedulesOfActivity).calledWith(atLeast(2)).mockResolvedValueOnce([scheduleAm])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/allocation-dashboard/activities', {
        activities: expect.arrayContaining([
          {
            summary: 'Maths level 1',
            id: 1,
            allocationSummary: {
              allocated: 80,
              capacity: 100,
              percentageAllocated: 80,
              vacancies: 20,
            },
            schedules: [
              {
                id: 1,
                description: 'Houseblock 1 AM',
                endDate: '2021-01-01',
              },
              {
                id: 2,
                description: 'Houseblock 1 PM',
                endDate: null,
              },
            ],
          },
        ]),
        total: { allocated: 155, capacity: 250, percentageAllocated: 62, vacancies: 95 },
      })
    })
  })
})
