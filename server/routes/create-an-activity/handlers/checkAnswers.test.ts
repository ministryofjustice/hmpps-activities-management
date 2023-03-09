import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../services/activitiesService'
import CheckAnswersRoutes from './checkAnswers'
import activity from '../../../services/fixtures/activity_1.json'
import atLeast from '../../../../jest.setup'
import PrisonService from '../../../services/prisonService'
import { ActivityLite } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')
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

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create an activity - Check answers', () => {
  const handler = new CheckAnswersRoutes(activitiesService, prisonService)
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
          pay: [{ incentiveLevel: 'Standard', bandId: 1, rate: 100 }],
          minimumIncentiveLevel: 'Standard',
          incentiveLevels: ['Standard', 'Enhanced'],
          educationLevels: [{ educationLevelCode: '1', educationLevelDescription: 'xxx' }],
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page with data from session', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/check-answers', {
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
    it('should create the allocation and redirect to confirmation page', async () => {
      const expectedActivity = {
        prisonCode: 'MDI',
        summary: 'Maths level 1',
        categoryId: 1,
        riskLevel: 'High',
        minimumIncentiveLevel: 'Standard',
        pay: [{ incentiveLevel: 'Standard', payBandId: 1, rate: 100 }],
        minimumEducationLevel: [{ educationLevelCode: '1', educationLevelDescription: 'xxx' }],
      }

      when(activitiesService.createActivity)
        .calledWith(atLeast(expectedActivity))
        .mockResolvedValueOnce(activity as unknown as ActivityLite)

      await handler.POST(req, res)
      expect(activitiesService.createActivity).toHaveBeenCalledWith(expectedActivity, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation/1')
    })

    it('should create the allocation when no education levels selected', async () => {
      const expectedActivity = {
        prisonCode: 'MDI',
        summary: 'Maths level 1',
        categoryId: 1,
        riskLevel: 'High',
        minimumIncentiveLevel: 'Standard',
        pay: [{ incentiveLevel: 'Standard', payBandId: 1, rate: 100 }],
      }

      req.session.createJourney.educationLevels = undefined

      when(activitiesService.createActivity)
        .calledWith(atLeast(expectedActivity))
        .mockResolvedValueOnce(activity as unknown as ActivityLite)

      await handler.POST(req, res)
      expect(activitiesService.createActivity).toHaveBeenCalledWith(expectedActivity, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation/1')
    })
  })
})
