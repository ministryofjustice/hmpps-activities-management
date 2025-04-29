import { Request, Response } from 'express'
import { format, startOfTomorrow, startOfYesterday } from 'date-fns'
import { when } from 'jest-when'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../../services/activitiesService'
import CancelMultipleSessionsViewEditDetailsRoutes from './viewOrEditDetails'
import UserService from '../../../../../services/userService'
import atLeast from '../../../../../../jest.setup'
import { UserDetails } from '../../../../../@types/manageUsersApiImport/types'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/userService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const userService = new UserService(null, null, null) as jest.Mocked<UserService>

describe('Route Handlers - Cancelled sessions - view or edit', () => {
  const handler = new CancelMultipleSessionsViewEditDetailsRoutes(activitiesService, userService)
  const today = format(new Date(), 'yyyy-MM-dd')

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

    when(userService.getUserMap)
      .calledWith(atLeast([null]))
      .mockResolvedValue(new Map([]) as Map<string, UserDetails>)
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('should render page with all details - session in the future', async () => {
      const activityDate = format(startOfTomorrow(), 'yyyy-MM-dd')
      const activityInstance = {
        id: 1,
        activitySchedule: {
          id: 2,
          activity: {
            id: 2,
            paid: true,
          },
        },
        date: activityDate,
      } as ScheduledActivity

      when(activitiesService.getScheduledActivity).calledWith(1, res.locals.user).mockResolvedValue(activityInstance)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/cancel-multiple-sessions/view-cancellation-details',
        {
          instance: { ...activityInstance, isAmendable: true },
          userMap: undefined,
          isPayable: true,
        },
      )
    })
    it('should render page - session in the past so pay not amendable', async () => {
      const activityDate = format(startOfYesterday(), 'yyyy-MM-dd')
      const activityInstance = {
        id: 1,
        activitySchedule: {
          id: 2,
          activity: {
            id: 2,
            paid: true,
          },
        },
        date: activityDate,
      } as ScheduledActivity

      when(activitiesService.getScheduledActivity).calledWith(1, res.locals.user).mockResolvedValue(activityInstance)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/cancel-multiple-sessions/view-cancellation-details',
        {
          instance: { ...activityInstance, isAmendable: false },
          userMap: undefined,
          isPayable: true,
        },
      )
    })
    it('should render page without pay section', async () => {
      const activityInstance = {
        id: 1,
        activitySchedule: {
          id: 2,
          activity: {
            id: 2,
            paid: false,
          },
        },
        date: today,
      } as ScheduledActivity

      when(activitiesService.getScheduledActivity).calledWith(1, res.locals.user).mockResolvedValue(activityInstance)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/cancel-multiple-sessions/view-cancellation-details',
        {
          instance: { ...activityInstance, isAmendable: true },
          userMap: undefined,
          isPayable: false,
        },
      )
    })
  })
})
