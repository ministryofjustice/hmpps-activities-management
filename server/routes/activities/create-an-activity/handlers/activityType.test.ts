import type { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ActivityTypeRoutes, { ActivityType } from './activityType'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityCategory } from '../../../../@types/activitiesAPI/types'
import { ActivityCategoryEnum } from '../../../../data/activityCategoryEnum'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('ActivityType Handler', () => {
  let req: Request
  let res: Response
  let handler: ActivityTypeRoutes

  beforeEach(() => {
    req = {
      journeyData: {
        createJourney: {
          outsideWork: true,
        },
      },
      body: {},
    } as unknown as Request

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      locals: {
        user: {
          externalActivitiesRolledOut: true,
        },
      },
    } as unknown as Response

    activitiesService.getActivityCategories.mockResolvedValue([
      { id: 10, code: ActivityCategoryEnum.SAA_ROTL, name: 'Outside activity' },
    ] as ActivityCategory[])
    handler = new ActivityTypeRoutes(activitiesService)
  })

  describe('ActivityType Validation', () => {
    it('should accept the inside option', async () => {
      const activityType = plainToInstance(ActivityType, { type: 'internal' })
      const errors = await validate(activityType)
      expect(errors).toHaveLength(0)
    })

    it('should accept the outside option', async () => {
      const activityType = plainToInstance(ActivityType, { type: 'external' })
      const errors = await validate(activityType)
      expect(errors).toHaveLength(0)
    })

    it('should fail validation when type is not provided', async () => {
      const activityType = plainToInstance(ActivityType, {})
      const errors = await validate(activityType)
      expect(errors).toHaveLength(1)
      expect(errors[0].property).toBe('type')
      expect(errors[0].constraints).toEqual({
        isIn: 'Select if the activity takes place inside or outside',
      })
    })

    it('should fail validation when type is empty string', async () => {
      const activityType = plainToInstance(ActivityType, { type: '' })
      const errors = await validate(activityType)
      expect(errors).toHaveLength(1)
      expect(errors[0].property).toBe('type')
      expect(errors[0].constraints).toEqual({
        isIn: 'Select if the activity takes place inside or outside',
      })
    })

    it('should fail validation when an invalid option is provided', async () => {
      const activityType = plainToInstance(ActivityType, { type: 'invalid' })
      const errors = await validate(activityType)

      expect(errors).toHaveLength(1)
      expect(errors[0].property).toBe('type')
      expect(errors[0].constraints).toEqual({
        isIn: 'Select if the activity takes place inside or outside',
      })
    })
  })

  describe('GET', () => {
    it('should render the activity type page', async () => {
      await handler.GET(req, res)

      expect(req.journeyData.createJourney.outsideWork).toBe(false)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/activity-type')
    })
  })

  describe('POST', () => {
    it('should set the ROTL category and redirect to the name page when outside is selected', async () => {
      req.body = { type: 'external' }
      const { POST } = handler

      await POST(req, res)

      expect(req.journeyData.createJourney.outsideWork).toBe(true)
      expect(req.journeyData.createJourney.category).toEqual({
        id: 10,
        code: ActivityCategoryEnum.SAA_ROTL,
        name: 'Outside activity',
      })
      expect(activitiesService.getActivityCategories).toHaveBeenCalledWith(res.locals.user, true)
      expect(res.redirect).toHaveBeenCalledWith('name')
    })

    it('should fail with a clear error when the ROTL category is unavailable', async () => {
      req.body = { type: 'external' }
      activitiesService.getActivityCategories.mockResolvedValue([])

      await expect(handler.POST(req, res)).rejects.toThrow('Activity category SAA_ROTL not found')

      expect(res.redirect).not.toHaveBeenCalled()
    })

    it('should set outsideWork to false when inside is selected', async () => {
      req.body = { type: 'internal' }

      await handler.POST(req, res)

      expect(req.journeyData.createJourney.outsideWork).toBe(false)
      expect(req.journeyData.createJourney.category).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith('category')
    })
  })
})
