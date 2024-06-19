import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import PayRateTypeRoutes, { PayRateType } from './payRateType'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import atLeast from '../../../../../jest.setup'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null)
describe('Route Handlers - Create an activity schedule - Pay Rate Type', () => {
  const handler = new PayRateTypeRoutes(prisonService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
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

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue([{ levelName: 'Standard' }] as IncentiveLevel[])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/pay-rate-type', {
        incentiveLevels: [{ levelName: 'Standard' }],
      })
    })
  })

  describe('POST', () => {
    it('should save selected option in session and redirect to pay page', async () => {
      req.body = {
        incentiveLevel: 'Basic',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('pay/single')
    })

    it('should redirect with a pay rate of single where there is an incentive level present', async () => {
      req.body = {
        incentiveLevel: 'Basic',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('pay/single')
    })

    it('should redirect with a pay rate of flat where there is a no incentive level present', async () => {
      req.body = {
        incentiveLevel: 'FLAT_RATE',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('pay/flat')
    })

    it('should redirect with preserveHistory flag', async () => {
      req.body = {
        incentiveLevel: 'Basic',
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
        incentiveLevel: '',
      }

      const requestObject = plainToInstance(PayRateType, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'incentiveLevel',
          error:
            'Select if you want to create a pay rate for a single incentive level or a flat rate for all incentive levels',
        },
      ])
    })
  })
})
