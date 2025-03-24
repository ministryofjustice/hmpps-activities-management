import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import ActivitiesService from '../../../../../services/activitiesService'
import PayBandMultipleRoutes from './payBandMultiple'
import atLeast from '../../../../../../jest.setup'
import { Activity } from '../../../../../@types/activitiesAPI/types'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Pay band page', () => {
  const handler = new PayBandMultipleRoutes(activitiesService)
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
      params: { mode: 'create', allocationId: 1 },
      session: {
        allocateJourney: {
          inmates: [
            {
              prisonerName: 'Joe Bloggs',
              firstName: 'Joe',
              lastName: 'Bloggs',
              prisonCode: 'MDI',
              prisonerNumber: 'G9566GQ',
              cellLocation: '1-2-001',
              incentiveLevel: 'Enhanced',
            },
            {
              prisonerName: 'Gill Blake',
              firstName: 'Gill',
              lastName: 'Blake',
              prisonCode: 'MDI',
              prisonerNumber: 'G7174GE',
              cellLocation: '2-2-002',
              incentiveLevel: 'Standard',
            },
          ],
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
    it('redirects the page as all prisoners have their paybands automatically assigned', async () => {
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValueOnce({
          pay: [
            {
              incentiveLevel: 'Standard',
              prisonPayBand: { id: 1, alias: 'Standard rate' },
              rate: 125,
              startDate: '2025-01-01',
            },
            {
              incentiveLevel: 'Enhanced',
              prisonPayBand: { id: 1, alias: 'Enhanced rate 1', displaySequence: 1 },
              rate: 100,
              startDate: null,
            },
          ],
        } as Activity)
      await handler.GET(req, res)
      expect(req.session.allocateJourney.inmates).toStrictEqual([
        {
          prisonerName: 'Joe Bloggs',
          firstName: 'Joe',
          lastName: 'Bloggs',
          prisonCode: 'MDI',
          prisonerNumber: 'G9566GQ',
          cellLocation: '1-2-001',
          incentiveLevel: 'Enhanced',
          payBand: {
            id: 1,
            alias: 'Enhanced rate 1',
            rate: 100,
          },
        },
        {
          prisonerName: 'Gill Blake',
          firstName: 'Gill',
          lastName: 'Blake',
          prisonCode: 'MDI',
          prisonerNumber: 'G7174GE',
          cellLocation: '2-2-002',
          incentiveLevel: 'Standard',
          payBand: {
            id: 1,
            alias: 'Standard rate',
            rate: 125,
          },
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('check-and-confirm')
    })
    it('renders the page with one prisoner automatically assigned and one to be manually assigned', async () => {
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValueOnce({
          pay: [
            {
              incentiveLevel: 'Standard',
              prisonPayBand: { id: 1, alias: 'Standard rate' },
              rate: 125,
              startDate: '2025-01-01',
            },
            {
              incentiveLevel: 'Enhanced',
              prisonPayBand: { id: 2, alias: 'Enhanced rate 2', displaySequence: 2 },
              rate: 150,
              startDate: null,
            },
            {
              incentiveLevel: 'Enhanced',
              prisonPayBand: { id: 3, alias: 'Enhanced rate 3', displaySequence: 3 },
              rate: 200,
              startDate: null,
            },
            {
              incentiveLevel: 'Enhanced',
              prisonPayBand: { id: 1, alias: 'Enhanced rate 1', displaySequence: 1 },
              rate: 100,
              startDate: null,
            },
          ],
        } as Activity)
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/payBandMultiple',
        {
          payBandsRequiringManualAssign: [
            {
              prisonerNumber: 'G9566GQ',
              firstName: 'Joe',
              middleNames: undefined,
              lastName: 'Bloggs',
              prisonId: 'MDI',
              incentiveLevel: 'Enhanced',
              payBands: [
                {
                  incentiveLevel: 'Enhanced',
                  bandId: 1,
                  bandAlias: 'Enhanced rate 1',
                  rate: 100,
                  startDate: null,
                },
                {
                  incentiveLevel: 'Enhanced',
                  bandId: 2,
                  bandAlias: 'Enhanced rate 2',
                  rate: 150,
                  startDate: null,
                },
                {
                  incentiveLevel: 'Enhanced',
                  bandId: 3,
                  bandAlias: 'Enhanced rate 3',
                  rate: 200,
                  startDate: null,
                },
              ],
            },
          ],
          payBandsToAutomaticallyAssign: [
            {
              prisonerNumber: 'G7174GE',
              firstName: 'Gill',
              middleNames: undefined,
              lastName: 'Blake',
              prisonId: 'MDI',
              incentiveLevel: 'Standard',
              payBands: [
                {
                  incentiveLevel: 'Standard',
                  bandId: 1,
                  bandAlias: 'Standard rate',
                  rate: 125,
                  startDate: '2025-01-01',
                },
              ],
            },
          ],
        },
      )
    })
    it('renders the page with both prisoners needing manual assign', async () => {
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          pay: [
            {
              incentiveLevel: 'Standard',
              prisonPayBand: { id: 1, alias: 'Standard rate', displaySequence: 1 },
              rate: 125,
              startDate: '2025-01-01',
            },
            {
              incentiveLevel: 'Standard',
              prisonPayBand: { id: 2, alias: 'Standard rate 2', displaySequence: 2 },
              rate: 130,
              startDate: '2025-01-01',
            },
            {
              incentiveLevel: 'Enhanced',
              prisonPayBand: { id: 2, alias: 'Enhanced rate 2', displaySequence: 2 },
              rate: 150,
              startDate: null,
            },
            {
              incentiveLevel: 'Enhanced',
              prisonPayBand: { id: 1, alias: 'Enhanced rate 1', displaySequence: 1 },
              rate: 100,
              startDate: null,
            },
          ],
        } as Activity)
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/payBandMultiple',
        {
          payBandsRequiringManualAssign: [
            {
              prisonerNumber: 'G9566GQ',
              firstName: 'Joe',
              middleNames: undefined,
              lastName: 'Bloggs',
              prisonId: 'MDI',
              incentiveLevel: 'Enhanced',
              payBands: [
                {
                  incentiveLevel: 'Enhanced',
                  bandId: 1,
                  bandAlias: 'Enhanced rate 1',
                  rate: 100,
                  startDate: null,
                },
                {
                  incentiveLevel: 'Enhanced',
                  bandId: 2,
                  bandAlias: 'Enhanced rate 2',
                  rate: 150,
                  startDate: null,
                },
              ],
            },
            {
              prisonerNumber: 'G7174GE',
              firstName: 'Gill',
              middleNames: undefined,
              lastName: 'Blake',
              prisonId: 'MDI',
              incentiveLevel: 'Standard',
              payBands: [
                {
                  incentiveLevel: 'Standard',
                  bandId: 1,
                  bandAlias: 'Standard rate',
                  rate: 125,
                  startDate: '2025-01-01',
                },
                {
                  incentiveLevel: 'Standard',
                  bandId: 2,
                  bandAlias: 'Standard rate 2',
                  rate: 130,
                  startDate: '2025-01-01',
                },
              ],
            },
          ],
          payBandsToAutomaticallyAssign: [],
        },
      )
    })
  })
//   describe('POST', () => {
//     it('', () => {})
//   })
})
