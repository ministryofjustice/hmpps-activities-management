import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import PayRateTypeRoutes, { PayRateType } from './payRateType'
import { associateErrorsWithProperty } from '../../../utils/utils'

describe('Route Handlers - Create an activity schedule - Pay Rate Type', () => {
  const handler = new PayRateTypeRoutes()
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
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/pay-rate-type')
    })
  })

  describe('POST', () => {
    it('should save selected option in session and redirect to pay page', async () => {
      req.body = {
        payRateTypeOption: 'single',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.payRateTypeOption).toEqual('single')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('pay')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        payRateTypeOption: '',
      }

      const requestObject = plainToInstance(PayRateType, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'payRateTypeOption', error: 'Choose what type of rate you want to create.' }])
    })
  })
})
