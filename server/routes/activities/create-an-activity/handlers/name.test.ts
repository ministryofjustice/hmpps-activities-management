import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import NameRoutes, { Name } from './name'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity - Name', () => {
  const handler = new NameRoutes(activitiesService)
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/name')
    })
  })

  describe('POST', () => {
    it('should save entered name in session and redirect to risk level page', async () => {
      req.body = {
        name: 'Maths level 1',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.name).toEqual('Maths level 1')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('risk-level')
    })

    it('should save entered activity name in database', async () => {
      const updatedActivity = {
        summary: 'updated activity name',
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
          name: 'updated activity name',
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/activities/schedule/activities/undefined',
        'Activity updated',
        "We've updated the activity name for updated activity name",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        name: '',
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'name', error: 'Enter the name of the activity' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        name: '',
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'name', error: 'Enter the name of the activity' }])
    })

    it('validation fails if name contains more than 40 characters', async () => {
      const body = {
        name: 'An unreasonably long activity name to test validation',
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'name', error: 'You must enter a name which has no more than 40 characters' },
      ])
    })

    it('passes validation', async () => {
      const body = {
        name: 'Maths level 1',
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
