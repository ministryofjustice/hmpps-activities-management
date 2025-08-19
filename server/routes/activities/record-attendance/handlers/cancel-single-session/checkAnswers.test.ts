import { Request, Response } from 'express'
import { when } from 'jest-when'
import CancelSingleSessionCheckAnswersRoutes from './checkAnswers'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../../services/activitiesService'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Cancel Single Session Check Answers', () => {
  const handler = new CancelSingleSessionCheckAnswersRoutes(activitiesService)

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
      journeyData: {
        recordAttendanceJourney: {
          activityDate: '2025-03-24',
          sessionFilters: 'PM',
          selectedInstanceIds: [1],
          sessionCancellationSingle: {
            activityName: 'Kitchen tasks',
            reason: 'Staff unavailable',
            comment: 'Resume tomorrow',
            issuePayment: true,
          },
        },
      },
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('should render cancel single session check answers page with correct date and slot string - AM', async () => {
      const activityInstances = [
        {
          id: 1,
          timeSlot: 'AM',
          activitySchedule: {
            id: 2,
            activity: {
              id: 2,
              paid: true,
            },
          },
        },
      ] as ScheduledActivity[]

      when(activitiesService.getScheduledActivities)
        .calledWith([1], res.locals.user)
        .mockResolvedValue(activityInstances)

      const activitiesRedirectUrl = `../../activities?date=2025-03-24&sessionFilters=PM&preserveHistory=true`

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/cancel-single-session/check-answers',
        {
          activityName: 'Kitchen tasks',
          reason: 'Staff unavailable',
          issuePayment: true,
          activitiesRedirectUrl,
        },
      )
    })

    it('should render cancel single session check answers page with correct date and slot string - AM, PM', async () => {
      const activityInstances = [
        {
          id: 1,
          timeSlot: 'AM',
          activitySchedule: {
            id: 2,
            activity: {
              id: 2,
              paid: true,
            },
          },
        },
        {
          id: 2,
          timeSlot: 'PM',
          activitySchedule: {
            id: 3,
            activity: {
              id: 3,
              paid: true,
            },
          },
        },
      ] as ScheduledActivity[]

      when(activitiesService.getScheduledActivities)
        .calledWith([1], res.locals.user)
        .mockResolvedValue(activityInstances)

      const activitiesRedirectUrl = `../../activities?date=2025-03-24&sessionFilters=PM&preserveHistory=true`

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/cancel-single-session/check-answers',
        {
          activityName: 'Kitchen tasks',
          reason: 'Staff unavailable',
          issuePayment: true,
          activitiesRedirectUrl,
        },
      )
    })

    it('should render cancel single session check answers page with correct date and slot string - AM, PM and ED', async () => {
      const activityInstances = [
        {
          id: 1,
          timeSlot: 'AM',
          activitySchedule: {
            id: 2,
            activity: {
              id: 2,
              paid: true,
            },
          },
        },
        {
          id: 3,
          timeSlot: 'ED',
          activitySchedule: {
            id: 4,
            activity: {
              id: 4,
              paid: true,
            },
          },
        },
        {
          id: 2,
          timeSlot: 'PM',
          activitySchedule: {
            id: 3,
            activity: {
              id: 3,
              paid: true,
            },
          },
        },
      ] as ScheduledActivity[]

      when(activitiesService.getScheduledActivities)
        .calledWith([1], res.locals.user)
        .mockResolvedValue(activityInstances)

      const activitiesRedirectUrl = `../../activities?date=2025-03-24&sessionFilters=PM&preserveHistory=true`

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/cancel-single-session/check-answers',
        {
          activityName: 'Kitchen tasks',
          reason: 'Staff unavailable',
          issuePayment: true,
          activitiesRedirectUrl,
        },
      )
    })
  })

  describe('POST', () => {
    it('should call the activity cancel instances endpoint with the correct data', async () => {
      await handler.POST(req, res)

      expect(activitiesService.cancelScheduledActivity).toHaveBeenCalledWith(
        1,
        {
          activityName: 'Kitchen tasks',
          reason: 'Staff unavailable',
          comment: 'Resume tomorrow',
          issuePayment: true,
        },
        {
          username: 'joebloggs',
        },
      )
      expect(res.redirect).toHaveBeenCalledWith('../../activities?date=2025-03-24&sessionFilters=PM')
    })
  })
})
