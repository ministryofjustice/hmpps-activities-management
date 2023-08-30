import { Request, Response } from 'express'
import { parse } from 'date-fns'
import CheckAnswersRoutes from './checkAnswers'
import ActivitiesService from '../../../../../services/activitiesService'
import { formatDate } from '../../../../../utils/utils'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null)

describe('Route Handlers - Waitlist application - Check answers', () => {
  const handler = new CheckAnswersRoutes(activitiesService)
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
      session: {
        waitListApplicationJourney: {
          prisoner: {
            name: 'Alan Key',
            prisonerNumber: 'ABC123',
          },
          requestDate: {
            day: 31,
            month: 7,
            year: 2023,
          },
          activity: {
            activityId: 1,
            activityName: 'Test activity',
          },
          requester: 'Alan Key',
          comment: 'test comment',
          status: 'PENDING',
        },
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
        requestDate: parse('2023-07-31', 'yyyy-MM-dd', new Date()),
        activityName: 'Test activity',
        requester: 'Alan Key',
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
          applicationDate: formatDate('2023-07-31', 'yyyy-MM-dd'),
          requestedBy: 'Alan Key',
          comments: 'test comment',
          status: 'PENDING',
        },
        { username: 'joebloggs' },
      )
      expect(res.redirect).toHaveBeenCalledWith(`confirmation`)
    })
  })
})
