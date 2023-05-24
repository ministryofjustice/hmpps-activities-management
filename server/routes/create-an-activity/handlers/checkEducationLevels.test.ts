import { Request, Response } from 'express'

import { when } from 'jest-when'
import CheckEducationLevelRoutes from './checkEducationLevels'
import ActivitiesService from '../../../services/activitiesService'
import atLeast from '../../../../jest.setup'
import activity from '../../../services/fixtures/activity_1.json'
import { Activity } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/prisonService')

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity - Check education levels', () => {
  const handler = new CheckEducationLevelRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      session: {
        createJourney: {
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          riskLevel: 'High',
          educationLevels: [
            {
              educationLevelCode: '1',
              educationLevelDescription: 'Reading Measure 1.0',
            },
            {
              educationLevelCode: '1.1',
              educationLevelDescription: 'Reading Measure 1.1',
            },
          ],
          incentiveLevels: ['Standard', 'Enhanced'],
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page correctly', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/check-education-level', {
        educationLevels: [
          {
            educationLevelCode: '1',
            educationLevelDescription: 'Reading Measure 1.0',
          },
          {
            educationLevelCode: '1.1',
            educationLevelDescription: 'Reading Measure 1.1',
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should add the minimum incentive level to the session and redirect', async () => {
      await handler.POST(req, res)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('start-date')
    })
  })

  it('should save entered education levels in database', async () => {
    const updatedActivity = {
      minimumEducationLevel: [{ educationLevelCode: '1', educationLevelDescription: 'Reading Measure 1.0' }],
    }

    when(activitiesService.updateActivity)
      .calledWith(atLeast(updatedActivity))
      .mockResolvedValueOnce(activity as unknown as Activity)

    req = {
      session: {
        createJourney: {
          educationLevels: [{ educationLevelCode: '1', educationLevelDescription: 'Reading Measure 1.0' }],
        },
      },
      query: {
        fromEditActivity: true,
      },
      body: {},
    } as unknown as Request

    await handler.POST(req, res)

    expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
      '/schedule/activities/undefined',
      'Activity updated',
      "We've updated the education levels for undefined",
    )
  })
})
