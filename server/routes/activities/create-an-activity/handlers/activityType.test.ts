import type { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ActivityTypeRoutes, { ActivityType } from './activityType'

describe('ActivityType Handler', () => {
  let req: Request
  let res: Response
  let handler: ActivityTypeRoutes

  beforeEach(() => {
    req = {
      journeyData: {
        createJourney: {
          activityOutsidePrison: true,
        },
      },
      body: {},
    } as unknown as Request

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    handler = new ActivityTypeRoutes()
  })

  describe('ActivityType Validation', () => {
    it('should accept internal type', async () => {
      const activityType = plainToInstance(ActivityType, { type: 'internal' })
      const errors = await validate(activityType)
      expect(errors).toHaveLength(0)
    })

    it('should accept external type', async () => {
      const activityType = plainToInstance(ActivityType, { type: 'external' })
      const errors = await validate(activityType)
      expect(errors).toHaveLength(0)
    })

    it('should fail validation when type is not provided', async () => {
      const activityType = plainToInstance(ActivityType, {})
      const errors = await validate(activityType)
      expect(errors).toHaveLength(1)
      expect(errors[0].property).toBe('type')
    })

    it('should fail validation when type is empty string', async () => {
      const activityType = plainToInstance(ActivityType, { type: '' })
      const errors = await validate(activityType)
      expect(errors).toHaveLength(1)
      expect(errors[0].property).toBe('type')
    })
  })

  describe('GET', () => {
    it('should render the activity type page', async () => {
      await handler.GET(req, res)

      expect(req.journeyData.createJourney.activityOutsidePrison).toBe(false)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/activity-type')
    })
  })

  describe('POST', () => {
    it('should set activityOutsidePrison to true when type is external', async () => {
      req.body = { type: 'external' }

      await handler.POST(req, res)

      expect(req.journeyData.createJourney.activityOutsidePrison).toBe(true)
      expect(res.redirect).toHaveBeenCalledWith('category')
    })

    it('should set activityOutsidePrison to false when type is not external', async () => {
      req.body = { type: 'internal' }

      await handler.POST(req, res)

      expect(req.journeyData.createJourney.activityOutsidePrison).toBe(false)
      expect(res.redirect).toHaveBeenCalledWith('category')
    })
  })
})
