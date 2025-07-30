import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import config from '../../../../config'
import ActivityAllocationHandler, { FromActivityList } from './prisonerActivityAllocations'
import { Activity, ActivitySummary } from '../../../../@types/activitiesAPI/types'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const mockActivities = [
  {
    id: 539,
    activityName: 'A Wing Cleaner 2',
    category: {
      id: 3,
      code: 'SAA_PRISON_JOBS',
      name: 'Prison jobs',
      description: 'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
    },
    capacity: 8,
    allocated: 4,
    waitlisted: 3,
    createdTime: '2023-10-23T09:59:24',
    activityState: 'LIVE',
  },
  {
    id: 110,
    activityName: 'A Wing Orderly',
    category: {
      id: 3,
      code: 'SAA_PRISON_JOBS',
      name: 'Prison jobs',
      description: 'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
    },
    capacity: 8,
    allocated: 4,
    waitlisted: 3,
    createdTime: '2023-10-23T09:59:24',
    activityState: 'LIVE',
  },
  {
    id: 310,
    activityName: 'B Wing Orderly',
    category: {
      id: 3,
      code: 'SAA_PRISON_JOBS',
      name: 'Prison jobs',
      description: 'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
    },
    capacity: 8,
    allocated: 4,
    waitlisted: 3,
    createdTime: '2023-10-23T09:59:24',
    activityState: 'LIVE',
  },
] as ActivitySummary[]

describe('Route Handlers - Prisoner Activity Allocations', () => {
  const handler = new ActivityAllocationHandler(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: { activeCaseLoadId: 'LEI', username: 'USER1', displayName: 'John Smith' },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: { prisonerNumber: 'ABC123' },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should redirect if feature toggle disabled', async () => {
      config.prisonerAllocationsEnabled = false
      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities')
    })

    it('should render prisoner allocations activity search page', async () => {
      config.prisonerAllocationsEnabled = true

      when(activitiesService.getActivities).calledWith(true, res.locals.user).mockResolvedValue(mockActivities)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/prisoner-allocations/activity-search', {
        activities: mockActivities,
      })
    })
  })

  describe('POST', () => {
    it('should redirect to the allocate activity page, when activity is selected from the activity search list', async () => {
      config.prisonerAllocationsEnabled = true
      req.body = {
        activityId: 539,
      }

      const mockActivity = {
        id: 539,
        description: 'A Wing Cleaner 2',
        schedules: [
          {
            id: 89,
          },
        ],
      } as Activity

      when(activitiesService.getActivity).calledWith(539, res.locals.user).mockResolvedValue(mockActivity)

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('/activities/allocations/create/prisoner/ABC123?scheduleId=89')
    })
  })

  describe('Validation', () => {
    it('validation fails when no activity is selected', async () => {
      const body = {}

      const requestObject = plainToInstance(FromActivityList, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'activityId', error: 'You must select an activity' }]))
    })
  })
})
