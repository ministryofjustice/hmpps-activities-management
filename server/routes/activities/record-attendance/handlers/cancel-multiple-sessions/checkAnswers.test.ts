import { Request, Response } from 'express'
import { when } from 'jest-when'
import CancelMultipleSessionsCheckAnswersRoutes from './checkAnswers'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../../services/activitiesService'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Cancel Multiple Sessions Check Answers', () => {
  const handler = new CancelMultipleSessionsCheckAnswersRoutes(activitiesService)

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
      session: {
        recordAttendanceJourney: {
          activityDate: '2025-03-24',
          sessionFilters: 'PM',
          selectedInstanceIds: [1],
          sessionCancellationMultiple: {
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
    it('should render cancel multiple sessions check answers page with correct date and slot string - AM', async () => {
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
      const selectedDateAndSlotsText = 'Monday, 24 March 2025 - AM'

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/cancel-multiple-sessions/check-answers',
        {
          instances: activityInstances,
          isPayable: true,
          reason: 'Staff unavailable',
          issuePayment: 'Yes',
          activitiesRedirectUrl,
          selectedDateAndSlotsText,
        },
      )
    })

    it('should render cancel multiple sessions check answers page with correct date and slot string - AM, PM', async () => {
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
      const selectedDateAndSlotsText = 'Monday, 24 March 2025 - AM and PM'

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/cancel-multiple-sessions/check-answers',
        {
          instances: activityInstances,
          isPayable: true,
          reason: 'Staff unavailable',
          issuePayment: 'Yes',
          activitiesRedirectUrl,
          selectedDateAndSlotsText,
        },
      )
    })

    it('should render cancel multiple sessions check answers page with correct date and slot string - AM, PM and ED', async () => {
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
      const selectedDateAndSlotsText = 'Monday, 24 March 2025 - AM, PM and ED'

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/cancel-multiple-sessions/check-answers',
        {
          instances: activityInstances,
          isPayable: true,
          reason: 'Staff unavailable',
          issuePayment: 'Yes',
          activitiesRedirectUrl,
          selectedDateAndSlotsText,
        },
      )
    })
  })

  describe('POST', () => {
    it('should call the activity cancel instances endpoint with the correct data', async () => {
      await handler.POST(req, res)

      expect(activitiesService.cancelMultipleActivities).toHaveBeenCalledWith(
        [1],
        {
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
