import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import PayBandRoutes, { PayBand } from './payBand'
import atLeast from '../../../../../jest.setup'
import { Activity, Allocation } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { IepSummary } from '../../../../@types/incentivesApi/types'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Edit Allocation - Pay band', () => {
  const handler = new PayBandRoutes(activitiesService, prisonService)
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
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        allocationId: 1,
      },
    } as unknown as Request

    when(prisonService.getPrisonerIepSummary)
      .calledWith(atLeast('ABC123'))
      .mockResolvedValue({
        iepLevel: 'Standard',
      } as IepSummary)
  })

  describe('GET', () => {
    const allocation = {
      id: 1,
      prisonerNumber: 'ABC123',
      bookingId: 1,
      activitySummary: 'Maths Level 1',
      activityId: 1,
      scheduleId: 1,
      scheduleDescription: '',
      isUnemployment: false,
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      prisonPayBand: {
        id: 1,
        displaySequence: 1,
        alias: 'Low',
        description: 'Low',
        nomisPayBand: 1,
        prisonCode: 'MDI',
      },
      status: 'ACTIVE',
    } as Allocation

    it('should render the expected view with pay bands sorted', async () => {
      when(activitiesService.getAllocation).calledWith(atLeast(1)).mockResolvedValue(allocation)
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
      const prisonerInfo = {
        prisonerNumber: 'ABC123',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('ABC123', res.locals.user)
        .mockResolvedValue(prisonerInfo)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocation-dashboard/pay-band', {
        prisonerName: 'John Smith',
        prisonerNumber: 'ABC123',
        incentiveLevel: 'Standard',
        activityId: 1,
        allocationId: 1,
        payBandId: 1,
        payBands: [
          {
            bandId: 1,
            bandAlias: 'Standard rate',
            rate: 125,
          },
        ],
        allocation,
      })
    })
  })

  describe('POST', () => {
    it('should save the selected pay band in session and redirect to check answers page', async () => {
      req.body = {
        payBand: 2,
        allocationId: 1,
        activityId: 1,
        prisonerNumber: 'ABC123',
      }

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/allocation-dashboard/1/check-allocation/ABC123',
        'Allocation updated',
        "We've updated the pay rate for this allocation",
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
})
