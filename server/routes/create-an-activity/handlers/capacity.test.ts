import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../utils/utils'
import CapacityRoutes, { Capacity } from './capacity'

describe('Route Handlers - Create an activity schedule - Capacity', () => {
  const handler = new CapacityRoutes()
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

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/capacity')
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
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        capacity: '',
      }

      const requestObject = plainToInstance(Capacity, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'capacity', error: 'Enter a capacity for the schedule more than 0' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        capacity: 'a',
      }

      const requestObject = plainToInstance(Capacity, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'capacity', error: 'Enter a capacity for the schedule more than 0' }])
    })
  })
})
