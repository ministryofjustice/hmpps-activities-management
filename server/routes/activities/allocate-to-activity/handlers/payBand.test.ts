import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import PayBandRoutes, { PayBand } from './payBand'
import atLeast from '../../../../../jest.setup'
import { Activity, PrisonPayBand } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocate - Pay band', () => {
  const handler = new PayBandRoutes(activitiesService)
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
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
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
  })

  describe('GET', () => {
    it('should render the expected view with pay bands sorted', async () => {
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

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/pay-band', {
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

      when(activitiesService.getPayBandsForPrison).mockResolvedValue([
        { id: 1, alias: 'Low' },
        { id: 2, alias: 'Medium' },
        { id: 3, alias: 'High' },
      ] as PrisonPayBand[])

      await handler.POST(req, res)

      expect(req.session.allocateJourney.inmate.payBand).toEqual({
        id: 2,
        alias: 'Medium',
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('check-answers')
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
