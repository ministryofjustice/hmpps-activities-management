import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../utils/utils'
import CategoryRoutes, { Category } from './category'
import ActivitiesService from '../../../services/activitiesService'
import { ActivityCategory } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null)

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
    } as unknown as Response

    req = {
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
        { id: 1, name: 'Services' },
        { id: 2, name: 'Education' },
      ] as ActivityCategory[])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/category', {
        categories: [
          { id: 1, name: 'Services' },
          { id: 2, name: 'Education' },
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
        { id: 1, name: 'Services' },
        { id: 2, name: 'Education' },
      ] as ActivityCategory[])

      await handler.POST(req, res)

      expect(req.session.createJourney.category).toEqual({
        id: 2,
        name: 'Education',
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('name')
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
