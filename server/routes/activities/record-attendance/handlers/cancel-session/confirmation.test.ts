import { Request, Response } from 'express'
import { when } from 'jest-when'
import ConfirmationRoutes from './confirmation'
import ActivitiesService from '../../../../../services/activitiesService'
import MetricsService from '../../../../../services/metricsService'
import MetricsEvent from '../../../../../data/MetricsEvent'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'
import AttendanceReason from '../../../../../enum/attendanceReason'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/metricsService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Cancel Session Confirmation', () => {
  const handler = new ConfirmationRoutes(activitiesService, metricsService)

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
      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/cancel-session/confirm')
    })
  })

  describe('POST', () => {
    let confirmRequest: Request

    const instance = {
      id: 1,
      endTime: '11:00',
      activitySchedule: {
        id: 2,
        activity: {
          id: 2,
          summary: 'Maths level 1',
        },
      },
      attendances: [
        { id: 1, prisonerNumber: 'ABC123', status: 'WAITING' },
        { id: 2, prisonerNumber: 'ABC321', status: 'WAITING' },
      ],
    } as unknown as ScheduledActivity

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

      when(activitiesService.getScheduledActivity).calledWith(1, res.locals.user).mockResolvedValue(instance)
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
      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.ATTENDANCE_RECORDED(instance, 'ABC123', AttendanceReason.CANCELLED, res.locals.user),
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
