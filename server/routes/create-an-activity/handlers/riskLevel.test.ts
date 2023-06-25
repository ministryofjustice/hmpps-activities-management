import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../utils/utils'
import RiskLevelRoutes, { RiskLevel } from './riskLevel'
import ActivitiesService from '../../../services/activitiesService'
import atLeast from '../../../../jest.setup'
import activity from '../../../services/fixtures/activity_1.json'
import { Activity } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
describe('Route Handlers - Create an activity - Risk level', () => {
  const handler = new RiskLevelRoutes(activitiesService)
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
      session: {
        createJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/risk-level')
    })
  })

  describe('POST', () => {
    it('should save the selected risk level in session and redirect to minimum incentive page', async () => {
      req.body = {
        riskLevel: 'high',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.riskLevel).toEqual('high')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('pay-rate-type')
    })

    it('should save entered risk level in database', async () => {
      const updatedActivity = {
        riskLevel: 'high',
      }

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      req = {
        session: {
          createJourney: {},
        },
        query: {
          fromEditActivity: true,
        },
        body: {
          riskLevel: 'high',
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/activities/schedule/activities/undefined',
        'Activity updated',
        "We've updated the risk assessment level for undefined",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(RiskLevel, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'riskLevel', error: 'Select a risk level for the activity' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        riskLevel: 'bad',
      }

      const requestObject = plainToInstance(RiskLevel, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'riskLevel', error: 'Select a risk level for the activity' }])
    })

    it('passes validation', async () => {
      const body = {
        riskLevel: 'high',
      }

      const requestObject = plainToInstance(RiskLevel, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
