import { Request, Response } from 'express'
import { when } from 'jest-when'
import CheckPayRoutes from './checkPay'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import { Activity } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import IncentiveLevelPayMappingUtil from './helpers/incentiveLevelPayMappingUtil'
import { CreateAnActivityJourney } from '../../create-an-activity/journey'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const incentiveLevelPayMappingUtil = new IncentiveLevelPayMappingUtil(prisonService)

describe('Route Handlers - Edit an activity - Check pay', () => {
  const handler = new CheckPayRoutes(activitiesService, prisonService)
  let req: Request
  let res: Response

  const activity = {
    id: 1,
    schedules: [
      {
        id: 2,
        allocations: [
          {
            id: 1,
            prisonerNumber: 'AB1234C',
            prisonPayBand: {
              id: 1,
            },
          },
          {
            id: 2,
            prisonerNumber: 'CB4321A',
            prisonPayBand: {
              id: 1,
            },
          },
        ],
      },
    ],
  } as Activity

  const incentiveLevels = [
    { levelCode: 'BAS', levelName: 'Basic' },
    { levelCode: 'STD', levelName: 'Standard' },
    { levelCode: 'ENH', levelName: 'Enhanced' },
  ] as IncentiveLevel[]

  const prisoners = [
    {
      prisonerNumber: 'AB1234C',
      currentIncentive: {
        level: {
          description: 'Basic',
        },
      },
    },
    {
      prisonerNumber: 'CB4321A',
      currentIncentive: {
        level: {
          description: 'Enhanced',
        },
      },
    },
  ] as Prisoner[]

  const activityPay = [
    {
      bandId: 1,
      incentiveLevel: 'Basic',
      rate: 100,
    },
    {
      bandId: 1,
      incentiveLevel: 'Enhanced',
      rate: 150,
    },
  ] as CreateAnActivityJourney['pay']

  const activityFlatPay = [
    {
      bandId: 2,
      rate: 120,
    },
  ]

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {
          activityId: 1,
          pay: activityPay,
          flat: activityFlatPay,
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(activitiesService.getActivity).calledWith(atLeast(1)).mockResolvedValue(activity)
      when(prisonService.getIncentiveLevels).calledWith(atLeast('MDI')).mockResolvedValue(incentiveLevels)
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(atLeast(['AB1234C', 'CB4321A']))
        .mockResolvedValue(prisoners)

      const incentiveLevelPays = await incentiveLevelPayMappingUtil.getPayGroupedByIncentiveLevel(
        activityPay,
        expect.anything(),
        activity,
      )

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-schedules/check-pay', {
        incentiveLevelPays,
        flatPay: activityFlatPay,
      })
    })
  })
})
