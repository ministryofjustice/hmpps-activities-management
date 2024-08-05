import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { addDays, subDays } from 'date-fns'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import PayBandRoutes, { PayBand, payBandDetail, payBandWithDescription } from './payBand'
import atLeast from '../../../../../jest.setup'
import { Activity } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import { formatIsoDate } from '../../../../utils/datePickerUtils'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocate - Pay band', () => {
  const inThreeDays = addDays(new Date(), 3)
  const inThreeDaysStr = formatIsoDate(inThreeDays)
  const inThreeDaysMsg = formatDate(inThreeDaysStr)

  const threeDaysAgo = subDays(new Date(), 3)
  const threeDaysAgoStr = formatIsoDate(threeDaysAgo)

  const handler = new PayBandRoutes(activitiesService)
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
      redirectOrReturn: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: { mode: 'create', allocationId: 1 },
      session: {
        allocateJourney: {
          inmate: {
            prisonerName: 'Joe Bloggs',
            prisonerNumber: 'ABC123',
            cellLocation: '1-2-001',
            incentiveLevel: 'Enhanced',
          },
          activity: {
            activityId: 1,
            scheduleId: 1,
            name: 'Maths',
            location: 'Education room 1',
          },
        },
      },
    } as unknown as Request

    when(activitiesService.getActivity)
      .calledWith(atLeast(1))
      .mockResolvedValue({
        pay: [
          {
            incentiveLevel: 'Standard',
            prisonPayBand: { id: 1, alias: 'Standard rate' },
            rate: 125,
          },
          {
            incentiveLevel: 'Enhanced',
            prisonPayBand: { id: 2, alias: 'Enhanced rate 2', displaySequence: 2 },
            rate: 150,
          },
          {
            incentiveLevel: 'Enhanced',
            prisonPayBand: { id: 3, alias: 'Enhanced rate 3', displaySequence: 3 },
            rate: 200,
          },
          {
            incentiveLevel: 'Enhanced',
            prisonPayBand: { id: 1, alias: 'Enhanced rate 1', displaySequence: 1 },
            rate: 100,
          },
        ],
      } as Activity)
  })

  describe('GET', () => {
    it('should render the expected view with pay bands sorted', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/pay-band', {
        prisonerName: 'Joe Bloggs',
        prisonerNumber: 'ABC123',
        incentiveLevel: 'Enhanced',
        payBands: [
          {
            bandId: 1,
            bandAlias: 'Enhanced rate 1',
            rate: 100,
          },
          {
            bandId: 2,
            bandAlias: 'Enhanced rate 2',
            rate: 150,
          },
          {
            bandId: 3,
            bandAlias: 'Enhanced rate 3',
            rate: 200,
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should save the selected pay band in session and redirect to check answers page', async () => {
      req.body = {
        payBand: 2,
      }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.inmate.payBand).toEqual({
        id: 2,
        alias: 'Enhanced rate 2',
        rate: 150,
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('exclusions')
    })

    it('edit mode should edit the allocation and redirect with success', async () => {
      req.params.mode = 'edit'
      req.body = {
        payBand: 2,
      }

      await handler.POST(req, res)

      expect(activitiesService.updateAllocation).toHaveBeenCalledWith(
        1,
        {
          payBandId: 2,
        },
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/activities/allocations/view/1`,
        'Allocation updated',
        `You've updated the pay rate for this allocation`,
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(PayBand, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'payBand', error: 'Select a pay band' }])
    })

    it('passes validation', async () => {
      const body = {
        payBand: 1,
      }

      const requestObject = plainToInstance(PayBand, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })

  describe('multiple paybands', () => {
    it('should create an array of pay bands with descriptions where there is a pay change in the future', async () => {
      const originalPayBands: payBandDetail[] = [
        {
          bandId: 19,
          bandAlias: 'Pay band 3',
          rate: 75,
          startDate: null,
        },
        {
          bandId: 19,
          bandAlias: 'Pay band 3',
          rate: 95,
          startDate: inThreeDaysStr,
        },
      ]

      const result = payBandWithDescription(originalPayBands)
      expect(result).toEqual([
        {
          bandId: 19,
          bandAlias: 'Pay band 3',
          rate: 75,
          startDate: null,
          description: `, set to change to £0.95 from ${inThreeDaysMsg}`,
        },
      ])
    })

    it('should create an array of pay bands with descriptions where there is a pay change in the past and future', async () => {
      const originalPayBands: payBandDetail[] = [
        {
          bandId: 19,
          bandAlias: 'Pay band 3',
          rate: 75,
          startDate: null,
        },
        {
          bandId: 19,
          bandAlias: 'Pay band 3',
          rate: 83,
          startDate: threeDaysAgoStr,
        },
        {
          bandId: 19,
          bandAlias: 'Pay band 3',
          rate: 95,
          startDate: inThreeDaysStr,
        },
      ]

      const result = payBandWithDescription(originalPayBands)
      expect(result).toEqual([
        {
          bandId: 19,
          bandAlias: 'Pay band 3',
          rate: 83,
          startDate: threeDaysAgoStr,
          description: `, set to change to £0.95 from ${inThreeDaysMsg}`,
        },
      ])
    })
  })
})
