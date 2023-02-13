import { Request, Response } from 'express'

import { when } from 'jest-when'
import PrisonService from '../../../services/prisonService'
import CheckPayRoutes from './checkPay'
import atLeast from '../../../../jest.setup'
import { IepLevel } from '../../../@types/incentivesApi/types'

jest.mock('../../../services/prisonService')
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

const prisonService = new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create an activity - Check pay', () => {
  const handler = new CheckPayRoutes(prisonService)
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
    } as unknown as Response

    req = {
      session: {
        createJourney: {
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          riskLevel: 'High',
          pay: [{ incentiveNomisCode: 'STD', incentiveLevel: 'Standard', bandId: 1, rate: 100 }],
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
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/check-pay', {
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
    it('should add the minimum incentive level to the session and redirect', async () => {
      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce([
          { iepLevel: 'ENH', iepDescription: 'Enhanced', sequence: 3 },
          { iepLevel: 'BAS', iepDescription: 'Basic', sequence: 1 },
          { iepLevel: 'STD', iepDescription: 'Standard', sequence: 2 },
        ] as IepLevel[])

      await handler.POST(req, res)
      expect(req.session.createJourney.minimumIncentiveLevel).toEqual('Standard')
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })
})
