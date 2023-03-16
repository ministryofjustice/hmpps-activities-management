import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import CheckAnswersRoutes from './checkAnswers'
import atLeast from '../../../../../jest.setup'
import createScheduleJourney from '../../../../services/fixtures/create_schedule_journey_1.json'
import createScheduleRequest from '../../../../services/fixtures/create_schedule_request_1.json'
import createScheduleResponse from '../../../../services/fixtures/create_schedule_response_1.json'
import { ActivityScheduleLite } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity schedule - Check answers', () => {
  const handler = new CheckAnswersRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
        activity: {
          id: 1,
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createScheduleJourney,
      },
      params: {
        activityId: '1',
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page with data from session', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/manage-schedules/create-schedule/check-answers', {
        days: ['tuesday', 'friday'],
        endDate: '18th January 2023',
        startDate: '17th January 2023',
        times: {
          tuesday: ['AM'],
          friday: ['PM', 'ED'],
        },
      })
    })
  })

  describe('POST', () => {
    it('should create the activity schedule and redirect to confirmation page', async () => {
      when(activitiesService.createScheduleActivity)
        .calledWith(atLeast(createScheduleRequest))
        .mockResolvedValueOnce(createScheduleResponse as ActivityScheduleLite)

      await handler.POST(req, res)
      expect(activitiesService.createScheduleActivity).toHaveBeenCalledWith(1, createScheduleRequest, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation/15')
    })
  })
})
