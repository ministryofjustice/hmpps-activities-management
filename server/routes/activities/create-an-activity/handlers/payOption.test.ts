import { Request, Response } from 'express'

import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import PayOption, { PayOptionForm } from './payOption'
import { YesNo } from '../../../../@types/activities'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import { ActivityPay } from '../../../../@types/activitiesAPI/types'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create an activity - Pay option', () => {
  const handler = new PayOption(prisonService)
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
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {},
      },
      query: {},
      body: {},
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page correctly', async () => {
      handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/pay-option')
    })
  })

  describe('POST', () => {
    it('should default minimum incentive level and redirect to qualifications page when activity is unpaid', async () => {
      req.body.paid = YesNo.NO

      req.session.createJourney.pay = [
        {
          incentiveNomisCode: 'STD',
          incentiveLevel: 'Standard',
          prisonPayBand: { id: 1 },
          rate: 1,
        },
      ] as ActivityPay[]

      req.session.createJourney.flat = [
        {
          prisonPayBand: { id: 2 },
          rate: 2,
        },
      ] as ActivityPay[]

      when(prisonService.getMinimumIncentiveLevel)
        .calledWith('MDI', res.locals.user, [], [])
        .mockResolvedValueOnce({ levelCode: 'BAS', levelName: 'Basic' } as IncentiveLevel)

      await handler.POST(req, res)

      expect(req.session.createJourney.minimumIncentiveLevel).toEqual('Basic')
      expect(req.session.createJourney.minimumIncentiveNomisCode).toEqual('BAS')

      expect(res.redirectOrReturn).toHaveBeenCalledWith('qualification')
    })

    it('should redirect to check pay page if activity is paid and has pay', async () => {
      req.body.paid = YesNo.YES
      req.session.createJourney.pay = [
        {
          incentiveNomisCode: 'STD',
          incentiveLevel: 'Standard',
          prisonPayBand: { id: 1 },
          rate: 1,
        },
      ] as ActivityPay[]

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('check-pay')
    })

    it('should redirect to check pay page if activity is paid and has no pay', async () => {
      req.body.paid = YesNo.YES
      req.session.createJourney.pay = []
      req.session.createJourney.flat = []

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('pay-rate-type')
    })
  })

  describe('Form validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(PayOptionForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'paid', error: 'Select whether this activity should be paid or unpaid' }])
    })

    it('validation fails if value is invalid', async () => {
      const body = {
        paid: 'invalid',
      }

      const requestObject = plainToInstance(PayOptionForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'paid', error: 'Select whether this activity should be paid or unpaid' }])
    })

    it('validation passes if valid value is provided', async () => {
      const body = {
        paid: YesNo.YES,
      }

      const requestObject = plainToInstance(PayOptionForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
