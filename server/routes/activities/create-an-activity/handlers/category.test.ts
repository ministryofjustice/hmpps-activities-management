import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import CategoryRoutes, { Category } from './category'
import ActivitiesService from '../../../../services/activitiesService'
import { Activity, ActivityCategory } from '../../../../@types/activitiesAPI/types'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import ActivityTier from '../../../../enum/activityTiers'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null)

describe('Route Handlers - Create an activity - Category', () => {
  const handler = new CategoryRoutes(activitiesService)
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
      redirectOrReturn: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
      session: {
        createJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(activitiesService.getActivityCategories).mockResolvedValue([
        { id: 1, code: 'SAA_SERVICES', name: 'Services' },
        { id: 2, code: 'SAA_EDUCATION', name: 'Education' },
      ] as ActivityCategory[])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/category', {
        categories: [
          { id: 1, code: 'SAA_SERVICES', name: 'Services' },
          { id: 2, code: 'SAA_EDUCATION', name: 'Education' },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should save selected category in session and redirect to name page', async () => {
      req.body = {
        category: 2,
      }

      when(activitiesService.getActivityCategories).mockResolvedValue([
        { id: 1, code: 'SAA_SERVICES', name: 'Services' },
        { id: 2, code: 'SAA_EDUCATION', name: 'Education' },
      ] as ActivityCategory[])

      await handler.POST(req, res)

      expect(req.session.createJourney.category).toEqual({
        id: 2,
        code: 'SAA_EDUCATION',
        name: 'Education',
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('name')
    })

    it('should save entered activity category in database', async () => {
      const updatedActivity = {
        categoryId: 2,
      }

      when(activitiesService.getActivityCategories).mockResolvedValue([
        { id: 1, code: 'SAA_SERVICES', name: 'Services' },
        { id: 2, code: 'SAA_EDUCATION', name: 'Education' },
      ] as ActivityCategory[])

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      req = {
        session: {
          createJourney: {
            activityId: '1',
          },
        },
        params: {
          mode: 'edit',
        },
        body: {
          category: 2,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/activities/view/1',
        'Activity updated',
        "You've updated the category for undefined",
      )
    })

    it('should set tier to "FOUNDATION" if "not in work" selected', async () => {
      req.body = {
        category: 1,
      }
      req.session.createJourney = {
        activityId: 1,
      }

      const updatedActivity = {
        categoryId: 1,
      }

      when(activitiesService.getActivityCategories).mockResolvedValue([
        { id: 1, code: 'SAA_NOT_IN_WORK', name: 'Not in work' },
      ] as ActivityCategory[])

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      await handler.POST(req, res)

      expect(req.session.createJourney.tierId).toEqual(ActivityTier.FOUNDATION)
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(Category, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'category', error: 'Select a category' }]))
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        category: 'bad',
      }

      const requestObject = plainToInstance(Category, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'category', error: 'Select a category' }]))
    })

    it('passes validation', async () => {
      const body = {
        category: '1',
      }

      const requestObject = plainToInstance(Category, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
