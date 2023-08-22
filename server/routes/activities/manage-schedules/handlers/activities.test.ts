import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import ActivitiesRoutes from './activities'
import { ActivityCategory, ActivityLite, ActivitySummary } from '../../../../@types/activitiesAPI/types'
import atLeast from '../../../../../jest.setup'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Activities dashboard', () => {
  const handler = new ActivitiesRoutes(activitiesService)
  let req: Request
  let res: Response

  const mockActivitiesData = () => {
    const educationCategory = {
      id: 1,
      name: 'Education',
    } as ActivityCategory

    const gymCategory = {
      id: 2,
      name: 'Gym, sport, fitness',
    } as ActivityCategory

    const maths = {
      id: 1,
      activityName: 'Maths level 1',
      category: educationCategory,
    } as ActivitySummary

    const english = {
      id: 2,
      activityName: 'English level 1',
      category: educationCategory,
    } as ActivitySummary

    const gym = {
      id: 3,
      activityName: 'Gym',
      category: gymCategory,
    } as ActivitySummary

    when(activitiesService.getActivities).mockResolvedValue([maths, english, gym])
    when(activitiesService.getActivityCategories).mockResolvedValue([educationCategory, gymCategory])
  }

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
    } as unknown as Request

    mockActivitiesData()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render all activities', async () => {
      req.query = { categoryFilter: 'all', stateFilter: 'all' }

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-schedules/activities-dashboard', {
        activities: [
          {
            category: {
              id: 1,
              name: 'Education',
            },
            activityName: 'Maths level 1',
            id: 1,
          },
          {
            category: {
              id: 1,
              name: 'Education',
            },
            activityName: 'English level 1',
            id: 2,
          },
          {
            category: {
              id: 2,
              name: 'Gym, sport, fitness',
            },
            activityName: 'Gym',
            id: 3,
          },
        ],
        categories: [
          {
            id: 1,
            name: 'Education',
          },
          {
            id: 2,
            name: 'Gym, sport, fitness',
          },
        ],
        filters: { categoryFilter: 'all', stateFilter: 'all' },
      })
    })

    it('should render education activities only', async () => {
      const educationCategory = {
        id: 1,
        name: 'Education',
      } as ActivityCategory

      when(activitiesService.getActivitiesInCategory)
        .calledWith(atLeast(1))
        .mockResolvedValue([
          {
            id: 1,
            summary: 'Maths level 1',
            category: educationCategory,
          } as ActivityLite,
          {
            id: 2,
            summary: 'English level 1',
            category: educationCategory,
          } as ActivityLite,
        ])

      req.query = { categoryFilter: '1' }

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-schedules/activities-dashboard', {
        activities: [
          {
            category: {
              id: 1,
              name: 'Education',
            },
            summary: 'Maths level 1',
            id: 1,
          },
          {
            category: {
              id: 1,
              name: 'Education',
            },
            summary: 'English level 1',
            id: 2,
          },
        ],
        categories: [
          {
            id: 1,
            name: 'Education',
          },
          {
            id: 2,
            name: 'Gym, sport, fitness',
          },
        ],
        filters: {
          categoryFilter: '1',
        },
      })
    })

    it('should render gym activities only', async () => {
      const gymCategory = {
        id: 2,
        name: 'Gym, sport, fitness',
      } as ActivityCategory

      when(activitiesService.getActivitiesInCategory)
        .calledWith(atLeast(2))
        .mockResolvedValue([
          {
            id: 3,
            summary: 'Gym',
            category: gymCategory,
            activityState: 'LIVE',
          } as ActivityLite,
        ])

      req.query = { categoryFilter: '2' }

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-schedules/activities-dashboard', {
        activities: [
          {
            category: {
              id: 2,
              name: 'Gym, sport, fitness',
            },
            summary: 'Gym',
            id: 3,
            activityState: 'LIVE',
          },
        ],
        categories: [
          {
            id: 1,
            name: 'Education',
          },
          {
            id: 2,
            name: 'Gym, sport, fitness',
          },
        ],
        filters: {
          categoryFilter: '2',
        },
      })
    })

    it('should render live activities only', async () => {
      const gymCategory = {
        id: 2,
        name: 'Gym, sport, fitness',
      } as ActivityCategory

      when(activitiesService.getActivitiesInCategory)
        .calledWith(atLeast(2))
        .mockResolvedValue([
          {
            id: 3,
            summary: 'Gym',
            category: gymCategory,
            activityState: 'LIVE',
          } as ActivityLite,
        ])

      req.query = { categoryFilter: '2', stateFilter: 'live' }

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-schedules/activities-dashboard', {
        activities: [
          {
            category: {
              id: 2,
              name: 'Gym, sport, fitness',
            },
            summary: 'Gym',
            id: 3,
            activityState: 'LIVE',
          },
        ],
        categories: [
          {
            id: 1,
            name: 'Education',
          },
          {
            id: 2,
            name: 'Gym, sport, fitness',
          },
        ],
        filters: {
          categoryFilter: '2',
          stateFilter: 'live',
        },
      })
    })

    it('should render archived activities only', async () => {
      const gymCategory = {
        id: 2,
        name: 'Gym, sport, fitness',
      } as ActivityCategory

      when(activitiesService.getActivitiesInCategory)
        .calledWith(atLeast(2))
        .mockResolvedValue([
          {
            id: 3,
            summary: 'Gym',
            category: gymCategory,
            activityState: 'LIVE',
          } as ActivityLite,
        ])

      req.query = { categoryFilter: '2', stateFilter: 'archived' }

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-schedules/activities-dashboard', {
        activities: [],
        categories: [
          {
            id: 1,
            name: 'Education',
          },
          {
            id: 2,
            name: 'Gym, sport, fitness',
          },
        ],
        filters: {
          categoryFilter: '2',
          stateFilter: 'archived',
        },
      })
    })
  })
})
