import { Request, Response } from 'express'

import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityUpdateRequest, PrisonPayBand } from '../../../../@types/activitiesAPI/types'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { ServiceUser } from '../../../../@types/express'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import PayCancelRoutes, { PayCancel } from './pay-cancel'
import { YesNo } from '../../../../@types/activities'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity - Pay date option', () => {
  const handler = new PayCancelRoutes(activitiesService)

  const user = {
    username: 'joebloggs',
    activeCaseLoadId: 'MDI',
  } as ServiceUser

  const inThreeDays = addDays(new Date(), 3)
  const inThreeDaysStr = formatIsoDate(inThreeDays)

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
      params: { payRateType: 'single', mode: 'edit' },
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
            },
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
              startDate: inThreeDaysStr,
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
          removeEndDate: false,
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
    it('should render page correctly', async () => {
      req.query = { iep: 'Basic', bandId: '18', paymentStartDate: inThreeDaysStr }
      req.params = { payRateType: 'single' }

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/pay-cancel', {
        rate: 65,
        iep: 'Basic',
        paymentStartDate: inThreeDaysStr,
        band: { id: 18, alias: 'High', displaySequence: 2 },
        payRateType: 'single',
      })
    })
  })

  describe('POST', () => {
    it('should cancel existing future payment change', async () => {
      req.body = {
        rate: 72,
        bandId: 17,
        incentiveLevel: 'Basic',
        startDate: inThreeDaysStr,
        cancelOption: YesNo.YES,
      }
      req.query = {
        preserveHistory: 'true',
      }

      await handler.POST(req, res)

      when(activitiesService.updateActivity).mockResolvedValue(undefined)

      const activityUpdateRequest = {
        paid: true,
        attendanceRequired: true,
        pay: [
          {
            incentiveNomisCode: 'BAS',
            incentiveLevel: 'Basic',
            payBandId: 17,
            rate: 50,
            startDate: undefined,
          },
          {
            incentiveNomisCode: 'BAS',
            incentiveLevel: 'Basic',
            payBandId: 18,
            rate: 65,
            startDate: undefined,
          },
        ],
      } as ActivityUpdateRequest

      expect(activitiesService.updateActivity).toHaveBeenCalledWith(33, activityUpdateRequest, user)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've cancelled the change to the pay amount for Basic:Pay band 1 (Lowest).`,
      )
    })

    it('should not cancel existing future payment change when user selects no', async () => {
      req.body = {
        rate: 72,
        bandId: 17,
        incentiveLevel: 'Basic',
        startDate: inThreeDaysStr,
        cancelOption: YesNo.NO,
      }
      req.query = {
        preserveHistory: 'true',
      }

      await handler.POST(req, res)

      when(activitiesService.updateActivity).mockResolvedValue(undefined)

      expect(activitiesService.updateActivity).not.toHaveBeenCalled()

      expect(res.redirect).toHaveBeenCalledWith('../check-pay?preserveHistory=true')
    })
  })

  describe('type validation', () => {
    let createJourney: unknown

    beforeEach(() => {
      createJourney = { pay: [], flat: [] }
    })

    it('validation fails if Yes or No have not been selected', async () => {
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 72,
        bandId: 17,
        incentiveLevel: 'Basic',
        startDate: '28/07/2025',
      }

      const requestObject = plainToInstance(PayCancel, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Select yes if you want to cancel the change',
            property: 'cancelOption',
          },
        ]),
      )
    })

    it('passes validation by selecting Yes', async () => {
      createJourney = { pay: [], flat: [], minimumPayRate: 70, maximumPayRate: 100 }
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 0.7,
        bandId: 1,
        incentiveLevel: 'Basic',
        bandAlias: 'Pay Band 1',
        cancelOption: 'YES',
        startDate: '24/07/2024',
      }

      const requestObject = plainToInstance(PayCancel, {
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
