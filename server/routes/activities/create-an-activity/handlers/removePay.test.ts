import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, subDays } from 'date-fns'
import RemovePayRoutes, { ConfirmRemoveOptions } from './removePay'
import { associateErrorsWithProperty, toDateString } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { CreateAnActivityJourney } from '../journey'
import { ActivityPay, ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create an activity - Remove pay', () => {
  const handler = new RemovePayRoutes(activitiesService, prisonService)
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
      query: {},
      params: {},
      session: {
        createJourney: {
          activityId: 1,
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          riskLevel: 'High',
          pay: [
            { incentiveLevel: 'Standard', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
            { incentiveLevel: 'Standard', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
            { incentiveLevel: 'Basic', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
            { incentiveLevel: 'Basic', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
          ],
          incentiveLevels: ['Basic', 'Standard'],
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should show confirmation page', async () => {
      req.query = { iep: 'Basic', bandId: '1' }
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/remove-pay', {
        iep: 'Basic',
        bandId: 1,
      })
    })

    it("should redirect back to check pay page if pay rate isn't found", async () => {
      req.query = { iep: 'NonExistentLevel', bandId: '1' }
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('check-pay')
    })
  })

  describe('POST', () => {
    it('should remove specified pay rate', async () => {
      req.body = { iep: 'Basic', bandId: '1', choice: 'yes' }
      await handler.POST(req, res)
      expect(req.session.createJourney.pay).toEqual([
        { incentiveLevel: 'Standard', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        { incentiveLevel: 'Standard', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
        { incentiveLevel: 'Basic', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
      ])
    })

    it('should remove specified pay rate and future pay rate change', async () => {
      const pay = [
        { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
        { incentiveNomisCode: 'BAS', incentiveLevel: 'Basic', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          prisonPayBand: { id: 1, alias: 'Low' },
          rate: 125,
          startDate: toDateString(addDays(new Date(), 2)),
        },
        { incentiveNomisCode: 'BAS', incentiveLevel: 'Basic', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
      ] as ActivityPay[]

      req.session.createJourney.pay = pay
      req.body = { iep: 'Basic', bandId: '1', choice: 'yes' }

      await handler.POST(req, res)
      expect(req.session.createJourney.pay).toEqual([
        { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
        { incentiveNomisCode: 'BAS', incentiveLevel: 'Basic', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
      ])
    })

    it('should redirect to check pay page', async () => {
      req.body = { iep: 'Basic', bandId: '1', choice: 'yes' }
      await handler.POST(req, res)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith('check-pay', 'Basic incentive level rate Low removed')
    })

    it('should not remove pay rate if action not confirmed', async () => {
      req.body = { iep: 'Basic', bandId: '1', choice: 'no' }
      await handler.POST(req, res)
      expect(req.session.createJourney.pay).toEqual([
        { incentiveLevel: 'Standard', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        { incentiveLevel: 'Standard', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
        { incentiveLevel: 'Basic', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        { incentiveLevel: 'Basic', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
      ])
    })

    it("should not remove pay rate if pay rate isn't found", async () => {
      req.body = { iep: 'NonExistentLevel', bandId: '1', choice: 'yes' }
      await handler.POST(req, res)
      expect(req.session.createJourney.pay).toEqual([
        { incentiveLevel: 'Standard', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        { incentiveLevel: 'Standard', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
        { incentiveLevel: 'Basic', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        { incentiveLevel: 'Basic', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
      ])
    })

    it('should update activity pay rates if its an edit journey', async () => {
      const payRates = [
        { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', prisonPayBand: { id: 2, alias: 'High' }, rate: 150 },
        { incentiveNomisCode: 'BAS', incentiveLevel: 'Basic', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
      ] as CreateAnActivityJourney['pay']

      req.session.createJourney.pay = payRates
      req.params = { mode: 'edit' }
      req.body = { iep: 'Basic', bandId: '1', choice: 'yes' }

      await handler.POST(req, res)

      const updatedActivity = {
        pay: [{ incentiveNomisCode: 'STD', incentiveLevel: 'Standard', payBandId: 2, rate: 150 }],
      } as ActivityUpdateRequest

      expect(activitiesService.updateActivity).toHaveBeenCalledWith(1, updatedActivity, res.locals.user)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'check-pay?preserveHistory=true',
        'Activity updated',
        `You've updated the pay for ${req.session.createJourney.name}`,
      )
    })

    it('should remove specified pay rate with a future and multiple historic pay rate change in the edit journey', async () => {
      const pay = [
        { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
        { incentiveNomisCode: 'BAS', incentiveLevel: 'Basic', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          prisonPayBand: { id: 2, alias: 'Low' },
          rate: 115,
          startDate: toDateString(subDays(new Date(), 22)),
        },
        {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          prisonPayBand: { id: 2, alias: 'Low' },
          rate: 125,
          startDate: toDateString(subDays(new Date(), 2)),
        },
        {
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          prisonPayBand: { id: 2, alias: 'Low' },
          rate: 125,
          startDate: toDateString(addDays(new Date(), 2)),
        },
        { incentiveNomisCode: 'BAS', incentiveLevel: 'Basic', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
      ] as ActivityPay[]

      req.session.createJourney.pay = pay
      req.body = { iep: 'Basic', bandId: '2', choice: 'yes' }
      req.params = { mode: 'edit' }

      await handler.POST(req, res)
      expect(req.session.createJourney.pay).toEqual([
        { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', prisonPayBand: { id: 2, alias: 'Low' }, rate: 100 },
        { incentiveNomisCode: 'BAS', incentiveLevel: 'Basic', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
      ])

      const updatedActivity = {
        pay: [
          { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', payBandId: 1, rate: 100 },
          { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', payBandId: 2, rate: 100 },
          { incentiveNomisCode: 'BAS', incentiveLevel: 'Basic', payBandId: 1, rate: 100 },
        ],
      } as ActivityUpdateRequest

      expect(activitiesService.updateActivity).toHaveBeenCalledWith(1, updatedActivity, res.locals.user)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'check-pay?preserveHistory=true',
        'Activity updated',
        `You've updated the pay for ${req.session.createJourney.name}`,
      )
    })

    it('should remove specified pay rate where other pay rates have multiple pay rates in the edit journey', async () => {
      const pay: ActivityPay[] = [
        {
          id: 4875,
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          prisonPayBand: {
            id: 61,
            displaySequence: 1,
            alias: 'Pay band 1 (Lowest)',
            description: 'Pay band 1 (Lowest)',
            nomisPayBand: 1,
            prisonCode: 'IWI',
          },
          rate: 50,
          pieceRate: null,
          pieceRateItems: null,
          startDate: null,
        },
        {
          id: 4878,
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          prisonPayBand: {
            id: 61,
            displaySequence: 1,
            alias: 'Pay band 1 (Lowest)',
            description: 'Pay band 1 (Lowest)',
            nomisPayBand: 1,
            prisonCode: 'IWI',
          },
          rate: 78,
          pieceRate: null,
          pieceRateItems: null,
          startDate: toDateString(new Date()),
        },
        {
          id: 4876,
          incentiveNomisCode: 'BAN',
          incentiveLevel: 'Gold',
          prisonPayBand: {
            id: 62,
            displaySequence: 2,
            alias: 'Pay band 2',
            description: 'Pay band 2',
            nomisPayBand: 2,
            prisonCode: 'IWI',
          },
          rate: 75,
          pieceRate: null,
          pieceRateItems: null,
          startDate: null,
        },
        {
          id: 4877,
          incentiveNomisCode: 'BAN',
          incentiveLevel: 'Gold',
          prisonPayBand: {
            id: 62,
            displaySequence: 2,
            alias: 'Pay band 2',
            description: 'Pay band 2',
            nomisPayBand: 2,
            prisonCode: 'IWI',
          },
          rate: 65,
          pieceRate: null,
          pieceRateItems: null,
          startDate: toDateString(new Date()),
        },
      ]

      req.session.createJourney.pay = pay
      req.body = { iep: 'Basic', bandId: '61', choice: 'yes' }
      req.params = { mode: 'edit' }

      await handler.POST(req, res)
      expect(req.session.createJourney.pay).toEqual([
        {
          id: 4876,
          incentiveNomisCode: 'BAN',
          incentiveLevel: 'Gold',
          prisonPayBand: {
            id: 62,
            displaySequence: 2,
            alias: 'Pay band 2',
            description: 'Pay band 2',
            nomisPayBand: 2,
            prisonCode: 'IWI',
          },
          rate: 75,
          pieceRate: null,
          pieceRateItems: null,
          startDate: null,
        },
        {
          id: 4877,
          incentiveNomisCode: 'BAN',
          incentiveLevel: 'Gold',
          prisonPayBand: {
            id: 62,
            displaySequence: 2,
            alias: 'Pay band 2',
            description: 'Pay band 2',
            nomisPayBand: 2,
            prisonCode: 'IWI',
          },
          rate: 65,
          pieceRate: null,
          pieceRateItems: null,
          startDate: toDateString(new Date()),
        },
      ])

      const updatedActivity = {
        pay: [
          { incentiveNomisCode: 'BAN', incentiveLevel: 'Gold', payBandId: 62, rate: 75, startDate: null },
          { incentiveNomisCode: 'BAN', incentiveLevel: 'Gold', payBandId: 62, rate: 65, startDate: '2024-10-28' },
        ],
      } as ActivityUpdateRequest

      expect(activitiesService.updateActivity).toHaveBeenCalledWith(1, updatedActivity, res.locals.user)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        'check-pay?preserveHistory=true',
        'Activity updated',
        `You've updated the pay for ${req.session.createJourney.name}`,
      )
    })
  })

  describe('Validation', () => {
    it('should pass validation when remove pay option is set to "no"', async () => {
      const body = {
        choice: 'no',
      }

      const requestObject = plainToInstance(ConfirmRemoveOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([])
    })

    it('should pass validation when remove pay option is set to "yes"', async () => {
      const body = {
        choice: 'yes',
      }

      const requestObject = plainToInstance(ConfirmRemoveOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([])
    })

    it('should fail validation when remove pay option not provided', async () => {
      const body = {}

      const requestObject = plainToInstance(ConfirmRemoveOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Confirm if you want to delete the pay rate or not',
            property: 'choice',
          },
        ]),
      )
    })
  })
})
