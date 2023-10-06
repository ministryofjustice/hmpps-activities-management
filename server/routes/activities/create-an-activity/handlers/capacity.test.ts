import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import CapacityRoutes, { Capacity } from './capacity'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity schedule - Capacity', () => {
  const handler = new CapacityRoutes(activitiesService)
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

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/capacity')
    })
  })

  describe('POST', () => {
    it('should save entered capacity in session and redirect to check your answers page', async () => {
      req.body = {
        capacity: 12,
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.capacity).toEqual(12)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('check-answers')
    })

    it('should save entered capacity in database', async () => {
      const updatedActivity = {
        capacity: 10,
      }

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
          capacity: 10,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/activities/view/1',
        'Activity updated',
        "We've updated the capacity for undefined",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        capacity: ' ',
      }

      const requestObject = plainToInstance(Capacity, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'capacity',
          error:
            'Enter the number of people who can be allocated to this activity. This must be a number between 1 and 999',
        },
      ])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        capacity: 'a',
      }

      const requestObject = plainToInstance(Capacity, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            property: 'capacity',
            error:
              'Enter the number of people who can be allocated to this activity. This must be a number between 1 and 999',
          },
        ]),
      )
    })

    it('validation fails if a value too small is entered', async () => {
      const body = {
        capacity: '0',
      }

      const requestObject = plainToInstance(Capacity, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'capacity',
          error:
            'Enter the number of people who can be allocated to this activity. This must be a number between 1 and 999',
        },
      ])
    })

    it('validation fails if a value too large is entered', async () => {
      const body = {
        capacity: '1000',
      }

      const requestObject = plainToInstance(Capacity, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'capacity',
          error:
            'Enter the number of people who can be allocated to this activity. This must be a number between 1 and 999',
        },
      ])
    })

    it('validation fails if a decimal number is entered', async () => {
      const body = {
        capacity: '10.5',
      }

      const requestObject = plainToInstance(Capacity, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'capacity',
          error:
            'Enter the number of people who can be allocated to this activity. This must be a number between 1 and 999',
        },
      ])
    })
  })
})
