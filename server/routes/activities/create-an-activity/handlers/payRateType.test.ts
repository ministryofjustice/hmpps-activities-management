import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import PayRateTypeRoutes, { PayRateType } from './payRateType'
import { associateErrorsWithProperty } from '../../../../utils/utils'

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
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {},
      },
      query: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/pay-rate-type')
    })
  })

  describe('POST', () => {
    it('should save selected option in session and redirect to pay page', async () => {
      req.body = {
        payRateTypeOption: 'single',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('pay/single')
    })

    it('should redirect with preserveHistory flag', async () => {
      req.body = {
        payRateTypeOption: 'single',
      }
      req.query = {
        preserveHistory: 'true',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('pay/single?preserveHistory=true')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        payRateTypeOption: '',
      }

      const requestObject = plainToInstance(PayRateType, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'payRateTypeOption',
          error:
            'Select if you want to create a pay rate for a single incentive level or a flat rate for all incentive levels',
        },
      ])
    })
  })
})
