import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../utils/utils'
import NameRoutes, { Name } from './name'

describe('Route Handlers - Create an activity - Name', () => {
  const handler = new NameRoutes()
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
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/name')
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
