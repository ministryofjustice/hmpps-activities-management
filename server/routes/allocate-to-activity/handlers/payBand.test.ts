import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../utils/utils'
import PayBandRoutes, { PayBand } from './payBand'
import atLeast from '../../../../jest.setup'
import { Activity } from '../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../services/activitiesService'

jest.mock('../../../services/activitiesService')

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
      redirect: jest.fn(),
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
    it('should render the expected view', async () => {
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          pay: [
            {
              incentiveLevel: 'Standard',
              payBand: 'A',
              rate: 125,
            },
            {
              incentiveLevel: 'Enhanced',
              payBand: 'A',
              rate: 150,
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
            rate: 150,
            band: 'A',
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should save the selected pay band in session and redirect to check answers page', async () => {
      req.body = {
        payBand: 'A',
      }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.inmate.payBand).toEqual('A')
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
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
        payBand: 'A',
      }

      const requestObject = plainToInstance(PayBand, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
