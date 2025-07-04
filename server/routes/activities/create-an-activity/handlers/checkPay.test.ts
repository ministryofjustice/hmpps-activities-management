import { Request, Response } from 'express'

import { when } from 'jest-when'
import PrisonService from '../../../../services/prisonService'
import CheckPayRoutes from './checkPay'
import ActivitiesService from '../../../../services/activitiesService'
import activityPayHistory from '../../../../services/fixtures/activity_pay_history_2.json'
import { ActivityPayHistory } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')
jest.mock('../../../../utils/helpers/incentiveLevelPayMappingUtil', () => {
  return function factory() {
    return {
      getPayGroupedByIncentiveLevel: () => [
        {
          incentiveLevel: 'Standard',
          pays: [{ incentiveLevel: 'Standard', bandId: 1, bandAlias: 'Common', rate: '150', prisonPayBand: { id: 1 } }],
        },
      ],
    }
  }
})

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity - Check pay', () => {
  const handler = new CheckPayRoutes(prisonService, activitiesService)
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
      redirect: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      flash: jest.fn(),
      query: {},
      params: {},
      routeContext: {},
      session: {
        createJourney: {
          activityId: 1,
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          riskLevel: 'High',
          pay: [
            { incentiveNomisCode: 'STD', incentiveLevel: 'Standard', bandId: 1, rate: 100, prisonPayBand: { id: 1 } },
          ],
          flat: [],
          incentiveLevels: ['Standard', 'Enhanced'],
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page correctly', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/check-pay', {
        activityName: 'Maths level 1',
        flatPay: [],
        incentiveLevelPays: [
          {
            incentiveLevel: 'Standard',
            pays: [
              { bandAlias: 'Common', bandId: 1, incentiveLevel: 'Standard', rate: '150', prisonPayBand: { id: 1 } },
            ],
          },
        ],
        displayPays: [
          {
            incentiveLevel: 'Standard',
            pays: [
              {
                incentiveLevel: 'Standard',
                bandId: 1,
                bandAlias: 'Common',
                rate: '150',
                prisonPayBand: {
                  id: 1,
                },
              },
            ],
          },
        ],
      })
    })

    it('should render EDIT page correctly', async () => {
      req.routeContext.mode = 'edit'

      when(activitiesService.getActivityPayHistory)
        .calledWith(req.session.createJourney.activityId, res.locals.user)
        .mockResolvedValueOnce(activityPayHistory as unknown as ActivityPayHistory)
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/edit-pay', {
        activityName: 'Maths level 1',
        flatPay: [],
        incentiveLevelPays: [
          {
            incentiveLevel: 'Standard',
            pays: [
              { bandAlias: 'Common', bandId: 1, incentiveLevel: 'Standard', rate: '150', prisonPayBand: { id: 1 } },
            ],
          },
        ],
        displayPays: [
          {
            incentiveLevel: 'Standard',
            pays: [
              {
                incentiveLevel: 'Standard',
                bandId: 1,
                bandAlias: 'Common',
                rate: '150',
                prisonPayBand: {
                  id: 1,
                },
              },
            ],
          },
        ],
        activityPayHistory: [
          {
            id: 28,
            incentiveNomisCode: 'BAS',
            incentiveLevel: 'Basic',
            prisonPayBand: {
              id: 19,
              displaySequence: 3,
              alias: 'Pay band 3',
              description: 'Pay band 3',
              nomisPayBand: 3,
              prisonCode: 'RSI',
              createdTime: null,
              createdBy: null,
              updatedTime: null,
              updatedBy: null,
            },
            rate: 100,
            startDate: null,
            changedDetails: 'New pay rate added: £1.00',
            changedTime: '2025-06-24T11:55:54.135',
            changedBy: 'joebloggs',
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should add a validation message to flash if no pay bands are added', async () => {
      req.session.createJourney.pay = []
      req.session.createJourney.flat = []

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('', 'Add at least one pay rate')
    })

    it('should redirect to qualification page', async () => {
      await handler.POST(req, res)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('qualification')
    })
  })
})
