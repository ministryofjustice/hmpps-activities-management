import { Request, Response } from 'express'
import CheckAnswersRoutes from './checkAnswers'
import ActivitiesService from '../../../../../services/activitiesService'
import MetricsService from '../../../../../services/metricsService'
import MetricsEvent from '../../../../../data/metricsEvent'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null)
const metricsService = new MetricsService(null)

describe('Route Handlers - Waitlist application - Check answers', () => {
  const handler = new CheckAnswersRoutes(activitiesService, metricsService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
      journeyData: {
        waitListApplicationJourney: {
          prisoner: {
            name: 'Alan Key',
            prisonerNumber: 'ABC123',
          },
          requestDate: '2023-07-31',
          activity: {
            activityId: 1,
            scheduleId: 1,
            activityName: 'Test activity',
          },
          requester: 'PRISONER',
          comment: 'test comment',
          status: 'PENDING',
        },
      },
      session: {
        journeyMetrics: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the check answers template', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(`pages/activities/waitlist-application/check-answers`, {
        prisoner: {
          name: 'Alan Key',
          prisonerNumber: 'ABC123',
        },
        requestDate: '2023-07-31',
        activityName: 'Test activity',
        requester: 'Self-requested',
        comment: 'test comment',
        status: 'PENDING',
      })
    })
  })

  describe('POST', () => {
    it('should set the activity in session and redirect to the requester route', async () => {
      await handler.POST(req, res)
      expect(activitiesService.logWaitlistApplication).toHaveBeenCalledWith(
        {
          prisonerNumber: 'ABC123',
          activityScheduleId: 1,
          applicationDate: '2023-07-31',
          requestedBy: 'PRISONER',
          comments: 'test comment',
          status: 'PENDING',
        },
        { username: 'joebloggs' },
      )
      expect(
        metricsService.trackEvent(
          MetricsEvent.WAITLIST_APPLICATION_JOURNEY_COMPLETED(
            req.journeyData.waitListApplicationJourney,
            res.locals.user,
          ).addJourneyCompletedMetrics(req),
        ),
      )
      expect(res.redirect).toHaveBeenCalledWith(`confirmation`)
    })
  })
})
