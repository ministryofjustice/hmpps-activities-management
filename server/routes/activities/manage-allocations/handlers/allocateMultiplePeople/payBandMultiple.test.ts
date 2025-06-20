import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import ActivitiesService from '../../../../../services/activitiesService'
import PayBandMultipleRoutes, { PayBandMultipleForm } from './payBandMultiple'
import atLeast from '../../../../../../jest.setup'
import { Activity } from '../../../../../@types/activitiesAPI/types'
import { associateErrorsWithProperty } from '../../../../../utils/utils'

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
      params: { allocationId: 1 },
      routeContext: { mode: 'create'},
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
      body: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('redurects the page if the activity is unpaid and has no paybands', async () => {
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValueOnce({
          pay: [],
          paid: false,
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
      ])
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
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
          numberPayBandsAvailable: 1,
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
          numberPayBandsAvailable: 1,
          payBand: {
            id: 1,
            alias: 'Standard rate',
            rate: 125,
          },
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
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
  describe('POST', () => {
    beforeEach(() => {
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
    })
    it('Assigns the correct paybands', async () => {
      req.body.inmatePayData = [
        {
          payBand: 1,
          prisonerName: 'Gill Blake',
          prisonerNumber: 'G7174GE',
          incentiveLevel: 'Standard',
        },
        {
          payBand: 2,
          prisonerName: 'Joe Bloggs',
          prisonerNumber: 'G9566GQ',
          incentiveLevel: 'Enhanced',
        },
      ]
      await handler.POST(req, res)
      expect(req.session.allocateJourney.inmates).toStrictEqual([
        {
          prisonerName: 'Joe Bloggs',
          firstName: 'Joe',
          lastName: 'Bloggs',
          prisonCode: 'MDI',
          prisonerNumber: 'G9566GQ',
          cellLocation: '1-2-001',
          incentiveLevel: 'Enhanced',
          numberPayBandsAvailable: 2,
          payBand: {
            id: 2,
            alias: 'Enhanced rate 2',
            rate: 150,
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
          numberPayBandsAvailable: 2,
          payBand: {
            id: 1,
            alias: 'Standard rate',
            rate: 125,
          },
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })
  describe('validation', () => {
    it('should pass validation', async () => {
      const requestData = {
        inmatePayData: [
          {
            payBand: 1,
            prisonerName: 'Gill Blake',
            prisonerNumber: 'G7174GE',
            incentiveLevel: 'Standard',
          },
          {
            payBand: 2,
            prisonerName: 'Joe Bloggs',
            prisonerNumber: 'G9566GQ',
            incentiveLevel: 'Enhanced',
          },
        ],
      }

      const requestObject = plainToInstance(PayBandMultipleForm, requestData)
      const errors = await validate(requestObject)
      expect(errors.length).toEqual(0)
    })
    it('should fail validation if a payBand is not selected', async () => {
      const requestData = {
        inmatePayData: [
          {
            payBand: 1,
            prisonerName: 'Gill Blake',
            prisonerNumber: 'G7174GE',
            incentiveLevel: 'Standard',
          },
          {
            prisonerName: 'Joe Bloggs',
            prisonerNumber: 'G9566GQ',
            incentiveLevel: 'Enhanced',
          },
        ],
      }

      const requestObject = plainToInstance(PayBandMultipleForm, requestData)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'payBand',
        error: 'Select a pay band for Joe Bloggs',
      })
    })
  })
})
