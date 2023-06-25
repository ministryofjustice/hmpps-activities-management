import { Request, Response } from 'express'

import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import PayRoutes, { Pay } from './pay'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import { PrisonPayBand } from '../../../../@types/activitiesAPI/types'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity - Pay', () => {
  const handler = new PayRoutes(prisonService, activitiesService)
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
        createJourney: {
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          riskLevel: 'High',
          incentiveLevels: ['Basic', 'Standard'],
          payRateTypeOption: 'single',
          pay: [],
        },
      },
      query: {},
    } as unknown as Request

    when(activitiesService.getPayBandsForPrison).mockResolvedValue([
      { id: 1, alias: 'Low', displaySequence: 1 },
      { id: 2, alias: 'High', displaySequence: 2 },
    ] as PrisonPayBand[])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page correctly', async () => {
      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue([{ levelName: 'Standard' }] as IncentiveLevel[])

      when(prisonService.getPayProfile).calledWith(atLeast('MDI')).mockResolvedValue({
        agencyId: 'MDI',
        startDate: '2015-06-26',
        autoPayFlag: true,
        minHalfDayRate: 0.1,
        maxHalfDayRate: 3,
      })

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/pay', {
        incentiveLevels: [{ levelName: 'Standard' }],
        payBands: [
          { id: 1, alias: 'Low', displaySequence: 1 },
          { id: 2, alias: 'High', displaySequence: 2 },
        ],
        payRateType: 'single',
        minimumPayRate: 10,
        maximumPayRate: 300,
      })
    })

    it('should render current pay rate', async () => {
      req.session.createJourney.pay = [
        {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          bandId: 1,
          rate: 1,
          bandAlias: 'High',
          displaySequence: 2,
        },
      ]
      req.query = {
        iep: 'Basic',
        bandId: '1',
      }

      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue([{ levelName: 'Standard' }] as IncentiveLevel[])

      when(prisonService.getPayProfile).calledWith(atLeast('MDI')).mockResolvedValue({
        agencyId: 'MDI',
        startDate: '2015-06-26',
        autoPayFlag: true,
        minHalfDayRate: 0.1,
        maxHalfDayRate: 3,
      })

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/pay', {
        incentiveLevels: [{ levelName: 'Standard' }],
        payBands: [
          { id: 1, alias: 'Low', displaySequence: 1 },
          { id: 2, alias: 'High', displaySequence: 2 },
        ],
        payRateType: 'single',
        minimumPayRate: 10,
        maximumPayRate: 300,
        pay: {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          bandId: 1,
          rate: 1,
          bandAlias: 'High',
          displaySequence: 2,
        },
      })
    })
  })

  describe('POST', () => {
    it('should add the selected pay to the session', async () => {
      req.body = {
        rate: 1,
        bandId: 2,
        incentiveLevel: 'Basic',
      }

      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce([
          { levelCode: 'BAS', levelName: 'Basic' },
          { levelCode: 'STD', levelName: 'Standard' },
          { levelCode: 'ENH', levelName: 'Enhanced' },
        ] as IncentiveLevel[])

      await handler.POST(req, res)

      expect(req.session.createJourney.pay).toEqual([
        {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          bandId: 2,
          rate: 1,
          bandAlias: 'High',
          displaySequence: 2,
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('check-pay')
    })

    it('should add to existing pay in session', async () => {
      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce([
          { levelCode: 'BAS', levelName: 'Basic' },
          { levelCode: 'STD', levelName: 'Standard' },
          { levelCode: 'ENH', levelName: 'Enhanced' },
        ] as IncentiveLevel[])
      req.session.createJourney.pay = [
        {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          bandId: 2,
          rate: 1,
          bandAlias: 'High',
          displaySequence: 2,
        },
      ]

      req.body = {
        rate: 1,
        bandId: 2,
        incentiveLevel: 'Standard',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.pay).toEqual([
        {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          bandId: 2,
          rate: 1,
          bandAlias: 'High',
          displaySequence: 2,
        },
        {
          incentiveNomisCode: 'STD',
          incentiveLevel: 'Standard',
          bandId: 2,
          rate: 1,
          bandAlias: 'High',
          displaySequence: 2,
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('check-pay')
    })

    it('should allow existing pay rate to be modified', async () => {
      req.body = {
        rate: 2,
        bandId: 2,
        incentiveLevel: 'Basic',
        currentPayBand: 1,
        currentIncentiveLevel: 'Basic',
      }
      req.session.createJourney.pay = [
        {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          bandId: 1,
          rate: 1,
          bandAlias: 'High',
          displaySequence: 2,
        },
      ]

      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce([{ levelCode: 'BAS', levelName: 'Basic' }] as IncentiveLevel[])

      await handler.POST(req, res)

      expect(req.session.createJourney.pay).toEqual([
        {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          bandId: 2,
          rate: 2,
          bandAlias: 'High',
          displaySequence: 2,
        },
      ])
    })
  })

  describe('type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(Pay, { ...body, ...{ createJourney: {} } })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Enter a pay rate',
            property: 'rate',
          },
          {
            error: 'Select a pay band',
            property: 'bandId',
          },
        ]),
      )
    })

    it('validation fails if iep and band combo is selected which already exists in session', async () => {
      const body = {
        rate: 1,
        bandId: 1,
        incentiveLevels: ['Basic'],
      }

      const requestObject = plainToInstance(Pay, {
        ...body,
        ...{
          createJourney: {
            minimumPayRate: 60,
            maximumPayRate: 275,
            pay: [{ incentiveLevel: 'Basic', bandId: 1 }],
          },
        },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'bandId', error: 'A rate for the selected band and incentive level already exists' },
      ])
    })

    it('passes validation', async () => {
      const body = {
        rate: 1,
        bandId: 1,
        incentiveLevels: ['Basic'],
      }

      const requestObject = plainToInstance(Pay, {
        ...body,
        ...{ createJourney: { minimumPayRate: 60, maximumPayRate: 275 } },
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
