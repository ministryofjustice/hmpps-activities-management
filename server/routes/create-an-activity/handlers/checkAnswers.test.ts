import { Request, Response } from 'express'

import ActivitiesService from '../../../services/activitiesService'
import CheckAnswersRoutes from './checkAnswers'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity - Check answers', () => {
  const handler = new CheckAnswersRoutes(activitiesService)
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
          minimumIncentive: 'Standard',
          incentiveLevels: ['Standard', 'Enhanced'],
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
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/check-answers')
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
        pay: [
          {
            incentiveLevel: 'Standard',
            payBand: 'A',
            rate: 125,
            pieceRate: 125,
            pieceRateItems: 10,
          },
          {
            incentiveLevel: 'Standard',
            payBand: 'B',
            rate: 150,
            pieceRate: 150,
            pieceRateItems: 10,
          },
          {
            incentiveLevel: 'Enhanced',
            payBand: 'A',
            rate: 125,
            pieceRate: 125,
            pieceRateItems: 10,
          },
          {
            incentiveLevel: 'Enhanced',
            payBand: 'B',
            rate: 150,
            pieceRate: 150,
            pieceRateItems: 10,
          },
        ],
      }

      await handler.POST(req, res)
      expect(activitiesService.createActivity).toHaveBeenCalledWith(expectedActivity, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation')
    })
  })
})
