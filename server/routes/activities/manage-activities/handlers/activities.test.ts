import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import ActivitiesRoutes from './activities'
import { ActivityCategory, ActivitySummary } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Activities dashboard', () => {
  const handler = new ActivitiesRoutes(activitiesService)
  let req: Request
  let res: Response

  let educationCategory: ActivityCategory
  let gymCategory: ActivityCategory
  let maths: ActivitySummary
  let english: ActivitySummary
  let gym: ActivitySummary

  const mockActivitiesData = () => {
    educationCategory = {
      id: 1,
      name: 'Education',
    } as ActivityCategory

    gymCategory = {
      id: 2,
      name: 'Gym, sport, fitness',
    } as ActivityCategory

    maths = {
      id: 1,
      activityName: 'Maths level 1',
      activityState: 'LIVE',
      category: educationCategory,
    } as ActivitySummary

    english = {
      id: 2,
      activityName: 'English level 1',
      activityState: 'LIVE',
      category: educationCategory,
    } as ActivitySummary

    gym = {
      id: 3,
      activityName: 'Gym',
      activityState: 'ARCHIVED',
      category: gymCategory,
    } as ActivitySummary

    when(activitiesService.getActivities).mockResolvedValue([maths, english, gym])
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-activities/activities-dashboard', {
        activities: [maths, english, gym],
        filters: { categoryFilter: 'all', stateFilter: 'all' },
      })
    })

    it('should render live activities only', async () => {
      req.query = { stateFilter: 'live' }

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-activities/activities-dashboard', {
        activities: [maths, english],
        filters: {
          stateFilter: 'live',
        },
      })
    })

    it('should render archived activities only', async () => {
      req.query = { stateFilter: 'archived' }

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-activities/activities-dashboard', {
        activities: [gym],
        filters: {
          stateFilter: 'archived',
        },
      })
    })
  })
})
