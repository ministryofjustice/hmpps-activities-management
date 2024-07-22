import { Request, Response } from 'express'

import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import PayAmountRoutes, { PayAmount } from './pay-amount'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import { PrisonPayBand } from '../../../../@types/activitiesAPI/types'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity - Pay amount', () => {
  const handler = new PayAmountRoutes(prisonService, activitiesService)
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
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: { payRateType: 'single' },
      session: {
        createJourney: {
          activityId: 33,
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          paid: true,
          pay: [
            {
              id: 349,
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              prisonPayBand: {
                id: 17,
                displaySequence: 1,
                alias: 'Pay band 1 (Lowest)',
                description: 'Pay band 1 (Lowest)',
                nomisPayBand: 1,
                prisonCode: 'RSI',
              },
              rate: 50,
              pieceRate: null,
              pieceRateItems: null,
              startDate: '2024-07-26',
            },
            {
              id: 353,
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              prisonPayBand: {
                id: 18,
                displaySequence: 2,
                alias: 'Pay band 2',
                description: 'Pay band 2',
                nomisPayBand: 2,
                prisonCode: 'RSI',
              },
              rate: 65,
              pieceRate: null,
              pieceRateItems: null,
              startDate: undefined,
            },
          ],
          flat: [],
          allocations: [],
          minimumPayRate: 50,
          maximumPayRate: 250,
        },
      },
    } as unknown as Request

    when(activitiesService.getPayBandsForPrison).mockResolvedValue([
      { id: 17, alias: 'Low', displaySequence: 1 },
      { id: 18, alias: 'High', displaySequence: 2 },
      { id: 3, alias: 'High 2', displaySequence: 3 },
    ] as PrisonPayBand[])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page correctly and match pay with a payment start date', async () => {
      req.query = { iep: 'Basic', bandId: '17', paymentStartDate: '2024-07-26' }

      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce([{ levelName: 'Standard' }] as IncentiveLevel[])

      when(prisonService.getPayProfile).calledWith(atLeast('MDI')).mockResolvedValue({
        agencyId: 'MDI',
        startDate: '2015-06-26',
        autoPayFlag: true,
        minHalfDayRate: 0.1,
        maxHalfDayRate: 3,
      })

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/pay-amount', {
        rate: 50,
        iep: 'Basic',
        paymentStartDate: '2024-07-26',
        band: { id: 17, alias: 'Low', displaySequence: 1 },
        payBands: [
          { id: 17, alias: 'Low', displaySequence: 1 },
          { id: 18, alias: 'High', displaySequence: 2 },
          { id: 3, alias: 'High 2', displaySequence: 3 },
        ],
        payRateType: 'single',
        minimumPayRate: 10,
        maximumPayRate: 300,
      })
    })
    it('should render page correctly and match pay without a payment start date', async () => {
      req.query = { iep: 'Basic', bandId: '18', paymentStartDate: 'undefined' }

      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce([{ levelName: 'Standard' }] as IncentiveLevel[])

      when(prisonService.getPayProfile).calledWith(atLeast('MDI')).mockResolvedValue({
        agencyId: 'MDI',
        startDate: '2015-06-26',
        autoPayFlag: true,
        minHalfDayRate: 0.1,
        maxHalfDayRate: 3,
      })

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/pay-amount', {
        rate: 65,
        iep: 'Basic',
        paymentStartDate: 'undefined',
        band: { id: 18, alias: 'High', displaySequence: 2 },
        payBands: [
          { id: 17, alias: 'Low', displaySequence: 1 },
          { id: 18, alias: 'High', displaySequence: 2 },
          { id: 3, alias: 'High 2', displaySequence: 3 },
        ],
        payRateType: 'single',
        minimumPayRate: 10,
        maximumPayRate: 300,
      })
    })
  })

  describe('POST', () => {
    it('should redirect with no defined start date where a start date exists for the pay rate', async () => {
      req.body = {
        rate: 72,
        bandId: 3,
        incentiveLevel: 'Basic',
      }
      req.query = { iep: 'Basic', bandId: '14', paymentStartDate: '2024-07-26' }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        '../pay-date-option/single?iep=Basic&bandId=3&paymentStartDate=2024-07-26&rate=72&preserveHistory=true',
      )
    })

    it('should redirect with no defined start date where no start date exists for the pay rate', async () => {
      req.body = {
        rate: 71,
        bandId: 2,
        incentiveLevel: 'Basic',
      }
      req.query = { iep: 'Basic', bandId: '17' }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        '../pay-date-option/single?iep=Basic&bandId=2&paymentStartDate=undefined&rate=71&preserveHistory=true',
      )
    })
  })

  describe('type validation', () => {
    let createJourney: unknown

    beforeEach(() => {
      createJourney = { pay: [], flat: [] }
    })

    it('validation fails if values are not entered', async () => {
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {}

      const requestObject = plainToInstance(PayAmount, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Enter a pay rate',
            property: 'rate',
          },
        ]),
      )
    })

    it('fails validation if the entered rate is below the minimum rate for the prison', async () => {
      createJourney = { pay: [], flat: [], minimumPayRate: 70, maximumPayRate: 100 }
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 0.5,
        bandId: 1,
      }

      const requestObject = plainToInstance(PayAmount, {
        createJourney,
        pathParams,
        queryParams,
        ...body,
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          error: 'Enter a pay amount that is at least £0.7 (minimum pay) and no more than £1 (maximum pay)',
          property: 'rate',
        },
      ])
    })

    it('fails validation if the entered rate is above the maximum rate for the prison', async () => {
      createJourney = { pay: [], flat: [], minimumPayRate: 70, maximumPayRate: 100 }
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 1.5,
        bandId: 1,
      }

      const requestObject = plainToInstance(PayAmount, {
        createJourney,
        pathParams,
        queryParams,
        ...body,
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          error: 'Enter a pay amount that is at least £0.7 (minimum pay) and no more than £1 (maximum pay)',
          property: 'rate',
        },
      ])
    })

    it('passes validation', async () => {
      createJourney = { pay: [], flat: [], minimumPayRate: 70, maximumPayRate: 100 }
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 0.7,
        bandId: 1,
        incentiveLevel: 'Basic',
      }

      const requestObject = plainToInstance(PayAmount, {
        createJourney,
        pathParams,
        queryParams,
        ...body,
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
