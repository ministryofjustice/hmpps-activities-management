import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import NameRoutes, { Name } from './name'

describe('Route Handlers - Create an activity schedule - Name', () => {
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
        createScheduleJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/manage-schedules/create-schedule/name')
    })
  })

  describe('POST', () => {
    it('should save entered name in session and redirect to start date page', async () => {
      req.body = {
        name: 'Evening maths club',
      }

      await handler.POST(req, res)

      expect(req.session.createScheduleJourney.name).toEqual('Evening maths club')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('start-date')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        name: '',
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'name', error: 'Enter a name for the schedule' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        name: '',
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'name', error: 'Enter a name for the schedule' }])
    })
  })
})
