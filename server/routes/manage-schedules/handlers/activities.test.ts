import { Request, Response } from 'express'

import ActivitiesService from '../../../services/activitiesService'
import ActivitiesRoutes from './activities'
import { ActivityLite } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Activities dashboard', () => {
  const handler = new ActivitiesRoutes(activitiesService)
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

    activitiesService.getActivities.mockResolvedValue([maths, english])
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
    it('should render activities', async () => {
      req.params = { categoryId: '1' }

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/manage-schedules/activities-dashboard', {
        activities: expect.arrayContaining([
          {
            summary: 'English level 1',
            id: 2,
          },
          {
            summary: 'Maths level 1',
            id: 1,
          },
        ]),
      })
    })
  })
})
