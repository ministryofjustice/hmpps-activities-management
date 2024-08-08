import { Request, Response } from 'express'

import { when } from 'jest-when'
import CheckEducationLevelRoutes from './checkEducationLevels'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'
import config from '../../../../config'

jest.mock('../../../../services/prisonService')

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

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
      params: {},
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
              studyAreaCode: 'ENGLA',
              studyAreaDescription: 'English Language',
            },
            {
              educationLevelCode: '1.1',
              educationLevelDescription: 'Reading Measure 1.1',
              studyAreaCode: 'ENGLA',
              studyAreaDescription: 'English Language',
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/check-education-level', {
        educationLevels: [
          {
            educationLevelCode: '1',
            educationLevelDescription: 'Reading Measure 1.0',
            studyAreaCode: 'ENGLA',
            studyAreaDescription: 'English Language',
          },
          {
            educationLevelCode: '1.1',
            educationLevelDescription: 'Reading Measure 1.1',
            studyAreaCode: 'ENGLA',
            studyAreaDescription: 'English Language',
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should add the minimum education level to the session and redirect', async () => {
      config.customStartEndTimesEnabled = false
      await handler.POST(req, res)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('start-date')
    })
    it('should add the minimum education level to the session and redirect', async () => {
      config.customStartEndTimesEnabled = true
      await handler.POST(req, res)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('schedule-frequency')
    })
  })

  it('should save entered education levels in database', async () => {
    const updatedActivity = {
      minimumEducationLevel: [
        {
          educationLevelCode: '1',
          educationLevelDescription: 'Reading Measure 1.0',
          studyAreaCode: 'ENGLA',
          studyAreaDescription: 'English Language',
        },
      ],
    }

    when(activitiesService.updateActivity)
      .calledWith(atLeast(updatedActivity))
      .mockResolvedValueOnce(activity as unknown as Activity)

    req = {
      session: {
        createJourney: {
          activityId: '1',
          educationLevels: [
            {
              educationLevelCode: '1',
              educationLevelDescription: 'Reading Measure 1.0',
              studyAreaCode: 'ENGLA',
              studyAreaDescription: 'English Language',
            },
          ],
        },
      },
      params: {
        mode: 'edit',
      },
      body: {},
    } as unknown as Request

    await handler.POST(req, res)

    expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
      '/activities/view/1',
      'Activity updated',
      "You've updated the education levels for undefined",
    )
  })
})
