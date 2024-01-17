import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import EndDateOptionRoutes, { EndDateOption } from './endDateOption'

describe('Route Handlers - Create an activity schedule - End date option', () => {
  const handler = new EndDateOptionRoutes()
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/end-date-option')
    })
  })

  describe('POST', () => {
    it('should save selected option in session and redirect to start date page', async () => {
      req.body = {
        endDateOption: 'yes',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.endDateOption).toEqual('yes')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('end-date')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        endDateOption: '',
      }

      const requestObject = plainToInstance(EndDateOption, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'endDateOption', error: 'Select if you want to enter an end date' }])
    })
  })
})
