import { Request, Response } from 'express'

import { when } from 'jest-when'
import PrisonService from '../../../../services/prisonService'
import CheckPayRoutes from './checkPay'
import atLeast from '../../../../../jest.setup'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import ActivitiesService from '../../../../services/activitiesService'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')
jest.mock('./helpers/incentiveLevelPayMappingUtil', () => {
  return function factory() {
    return {
      getPayGroupedByIncentiveLevel: () => [
        {
          incentiveLevel: 'Standard',
          pays: [{ incentiveLevel: 'Standard', bandId: 1, bandAlias: 'Common', rate: '150' }],
        },
      ],
    }
  }
})

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create an activity - Check pay', () => {
  const handler = new CheckPayRoutes(activitiesService, prisonService)
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
      session: {
        createJourney: {
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          riskLevel: 'High',
          pay: [{ incentiveNomisCode: 'STD', incentiveLevel: 'Standard', bandId: 1, rate: 100 }],
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
        flatPay: [],
        incentiveLevelPays: [
          {
            incentiveLevel: 'Standard',
            pays: [{ bandAlias: 'Common', bandId: 1, incentiveLevel: 'Standard', rate: '150' }],
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

    it('should add the minimum incentive level to the session and redirect', async () => {
      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce([
          { levelCode: 'BAS', levelName: 'Basic' },
          { levelCode: 'STD', levelName: 'Standard' },
          { levelCode: 'ENH', levelName: 'Enhanced' },
        ] as IncentiveLevel[])

      await handler.POST(req, res)
      expect(req.session.createJourney.minimumIncentiveLevel).toEqual('Standard')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('qualification')
    })

    it('should save entered pay in database', async () => {
      const updatedActivity = {
        pay: [
          {
            incentiveNomisCode: 'BAS',
            incentiveLevel: 'Basic',
            payBandId: 1,
            rate: 1,
          },
        ],
      }

      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce([
          { levelCode: 'BAS', levelName: 'Basic' },
          { levelCode: 'STD', levelName: 'Standard' },
          { levelCode: 'ENH', levelName: 'Enhanced' },
        ] as IncentiveLevel[])

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      req = {
        session: {
          createJourney: {
            activityId: 1,
            name: 'Maths Level 1',
            pay: [
              {
                incentiveNomisCode: 'BAS',
                incentiveLevel: 'Basic',
                payBandId: 1,
                rate: 1,
              },
            ],
          },
        },
        query: {
          fromEditActivity: true,
        },
        body: {},
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/activities/schedule/activities/1',
        'Activity updated',
        "We've updated the pay for Maths Level 1",
      )
    })
  })
})
