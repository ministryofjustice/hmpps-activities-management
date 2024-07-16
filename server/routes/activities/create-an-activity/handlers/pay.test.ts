import { Request, Response } from 'express'

import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, startOfDay } from 'date-fns'
import PayRoutes, { Pay } from './pay'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import { Activity, ActivityPay, ActivityUpdateRequest, PrisonPayBand } from '../../../../@types/activitiesAPI/types'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { CreateAnActivityJourney } from '../journey'
import { formatIsoDate } from '../../../../utils/datePickerUtils'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity - Pay', () => {
  const handler = new PayRoutes(prisonService, activitiesService)
  let req: Request
  let res: Response
  const tomorrow: Date = startOfDay(addDays(new Date(), 1))
  const tomorrowStr: string = formatIsoDate(tomorrow)

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
          activityId: 1,
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          riskLevel: 'High',
          incentiveLevels: ['Basic', 'Standard'],
          pay: [],
          flat: [],
          allocations: [],
        },
      },
      query: {},
    } as unknown as Request

    when(activitiesService.getPayBandsForPrison).mockResolvedValue([
      { id: 1, alias: 'Low', displaySequence: 1 },
      { id: 2, alias: 'High', displaySequence: 2 },
      { id: 3, alias: 'High 2', displaySequence: 3 },
    ] as PrisonPayBand[])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page correctly', async () => {
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/pay', {
        hasAllocations: false,
        incentiveLevels: [{ levelName: 'Standard' }],
        payBands: [
          { id: 1, alias: 'Low', displaySequence: 1 },
          { id: 2, alias: 'High', displaySequence: 2 },
          { id: 3, alias: 'High 2', displaySequence: 3 },
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
          prisonPayBand: { id: 1, alias: 'High', displaySequence: 2 },
          rate: 1,
        },
      ] as ActivityPay[]
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
        hasAllocations: false,
        incentiveLevels: [{ levelName: 'Standard' }],
        payBands: [
          { id: 1, alias: 'Low', displaySequence: 1 },
          { id: 2, alias: 'High', displaySequence: 2 },
          { id: 3, alias: 'High 2', displaySequence: 3 },
        ],
        payRateType: 'single',
        minimumPayRate: 10,
        maximumPayRate: 300,
        rate: 1,
        band: { id: 1, alias: 'Low', displaySequence: 1 },
        iep: 'Basic',
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
          rate: 1,
          prisonPayBand: {
            alias: 'High',
            displaySequence: 2,
            id: 2,
          },
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('../check-pay')
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
          prisonPayBand: { id: 2, alias: 'High', displaySequence: 2 },
          rate: 1,
        },
      ] as ActivityPay[]

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
          rate: 1,
          prisonPayBand: {
            alias: 'High',
            displaySequence: 2,
            id: 2,
          },
        },
        {
          incentiveNomisCode: 'STD',
          incentiveLevel: 'Standard',
          rate: 1,
          prisonPayBand: {
            alias: 'High',
            displaySequence: 2,
            id: 2,
          },
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('../check-pay')
    })

    it('should allow existing pay rate to be modified', async () => {
      req.query = { bandId: '1', iep: 'Basic' }

      req.body = {
        rate: 2,
        bandId: 2,
        incentiveLevel: 'Basic',
      }

      req.session.createJourney.pay = [
        {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          prisonPayBand: { id: 1, alias: 'High', displaySequence: 2 },
          rate: 1,
        },
      ] as ActivityPay[]

      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce([{ levelCode: 'BAS', levelName: 'Basic' }] as IncentiveLevel[])

      await handler.POST(req, res)

      expect(req.session.createJourney.pay).toEqual([
        {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          rate: 2,
          prisonPayBand: {
            alias: 'High',
            displaySequence: 2,
            id: 2,
          },
        },
      ])
    })

    it('should update activity pay rates if its an edit journey', async () => {
      const payRates = [
        { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', prisonPayBand: { id: 2, alias: 'Low' }, rate: 150 },
        { incentiveNomisCode: 'BAS', incentiveLevel: 'Basic', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
      ] as CreateAnActivityJourney['pay']

      req.session.createJourney.pay = payRates
      req.session.createJourney.flat = []

      req.params = {
        payRateType: 'flat',
        mode: 'edit',
      }
      req.body = {
        rate: 150,
        bandId: 3,
      }

      prisonService.getIncentiveLevels = jest.fn()
      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue([
          { levelCode: 'BAS', levelName: 'Basic' },
          { levelCode: 'STD', levelName: 'Standard' },
        ] as IncentiveLevel[])

      when(activitiesService.getActivity).mockResolvedValue({ schedules: [] } as Activity)

      await handler.POST(req, res)

      const updatedActivity = {
        paid: true,
        attendanceRequired: true,
        pay: [
          { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', payBandId: 2, rate: 150 },
          { incentiveNomisCode: 'BAS', incentiveLevel: 'Basic', payBandId: 1, rate: 100 },
          { incentiveNomisCode: 'BAS', incentiveLevel: 'Basic', payBandId: 3, rate: 150 },
          { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', payBandId: 3, rate: 150 },
        ] as unknown as ActivityPay[],
      } as unknown as ActivityUpdateRequest

      expect(activitiesService.updateActivity).toHaveBeenCalledWith(1, updatedActivity, res.locals.user)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've added a flat rate for High 2`,
      )
    })
  })

  describe('type validation', () => {
    let createJourney: unknown

    beforeEach(() => {
      createJourney = { pay: [], flat: [] }
    })

    it('validation fails if values are not entered', async () => {
      const pathParams = { payRateType: 'flat' }
      const queryParams = {}
      const body = {}

      const requestObject = plainToInstance(Pay, { createJourney, pathParams, queryParams, ...body })
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

    it('validation fails for no selected incentiveLevel if payRateType is single', async () => {
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = { payRateType: 'single' }

      const requestObject = plainToInstance(Pay, { createJourney, pathParams, queryParams, ...body })
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
          {
            error: 'Select an incentive level for the pay rate',
            property: 'incentiveLevel',
          },
        ]),
      )
    })

    it('validation fails if iep and band combo is selected which already exists in session', async () => {
      createJourney = { pay: [{ incentiveLevel: 'Basic', prisonPayBand: { id: 1 } }], flat: [] }
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 1,
        bandId: 1,
        incentiveLevel: 'Basic',
      }

      const requestObject = plainToInstance(Pay, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            property: 'bandId',
            error: 'You can only use each pay band once for a combination of incentive level and start date',
          },
        ]),
      )
    })

    it('validation fails if iep, band and start date combo is selected which already exists in session', async () => {
      const pay: ActivityPay[] = [
        {
          incentiveLevel: 'Basic',
          prisonPayBand: { id: 1 } as PrisonPayBand,
          startDate: tomorrowStr,
          rate: 1,
          id: 0,
          incentiveNomisCode: '',
        },
      ]
      createJourney = {
        pay,
        flat: [],
        minimumPayRate: 100,
        maximumPayRate: 200,
      }
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 1,
        bandId: 1,
        incentiveLevel: 'Basic',
        startDate: tomorrow,
      }

      const requestObject = plainToInstance(Pay, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            property: 'bandId',
            error: 'You can only use each pay band once for a combination of incentive level and start date',
          },
        ]),
      )
    })

    it('fails validation if the entered rate is below the minimum rate for the prison', async () => {
      createJourney = { pay: [], flat: [], minimumPayRate: 70, maximumPayRate: 100 }
      const pathParams = { payRateType: 'flat' }
      const queryParams = {}
      const body = {
        rate: 0.5,
        bandId: 1,
      }

      const requestObject = plainToInstance(Pay, {
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
      const pathParams = { payRateType: 'flat' }
      const queryParams = {}
      const body = {
        rate: 1.5,
        bandId: 1,
      }

      const requestObject = plainToInstance(Pay, {
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

      const requestObject = plainToInstance(Pay, {
        createJourney,
        pathParams,
        queryParams,
        ...body,
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('passes validation with same band ID, incentive level and different start date', async () => {
      createJourney = {
        pay: [{ incentiveLevel: 'Basic', prisonPayBand: { id: 1 }, startDate: '2024-06-30' }],
        flat: [],
        minimumPayRate: 70,
        maximumPayRate: 100,
      }
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 0.7,
        bandId: 1,
        incentiveLevel: 'Basic',
        startDate: tomorrow,
      }

      const requestObject = plainToInstance(Pay, {
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
