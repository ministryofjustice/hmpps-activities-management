import { Request, Response } from 'express'
import ConfirmationRoutes from './confirmation'
import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Cancel Session Confirmation', () => {
  const handler = new ConfirmationRoutes(activitiesService)

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
      query: {},
      params: {
        id: '1',
      },
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('should render cancel session confirmation page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/cancel-session/confirm')
    })
  })

  describe('POST', () => {
    let confirmRequest: Request

    beforeEach(() => {
      confirmRequest = {
        ...req,
        body: {
          confirm: 'yes',
        },
        session: {
          recordAttendanceRequests: {
            sessionCancellation: {
              reason: 'Staff unavailable',
              comment: 'Resume tomorrow',
            },
          },
        },
      } as unknown as Request
    })

    it('should cancel scheduled activity', async () => {
      await handler.POST(confirmRequest, res)

      expect(activitiesService.cancelScheduledActivity).toBeCalledWith(
        1,
        {
          reason: 'Staff unavailable',
          comment: 'Resume tomorrow',
        },
        {
          username: 'joebloggs',
        },
      )
      expect(res.redirect).toHaveBeenCalledWith('/activities/attendance/activities/1/attendance-list')
    })

    it('should redirect back to attendance list if not confirmed', async () => {
      confirmRequest.body.confirm = 'no'
      await handler.POST(confirmRequest, res)

      expect(activitiesService.cancelScheduledActivity).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith('/activities/attendance/activities/1/attendance-list')
    })
  })
})
