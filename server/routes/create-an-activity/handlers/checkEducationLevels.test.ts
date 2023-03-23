import { Request, Response } from 'express'

import CheckEducationLevelRoutes from './checkEducationLevels'

jest.mock('../../../services/prisonService')

describe('Route Handlers - Create an activity - Check education levels', () => {
  const handler = new CheckEducationLevelRoutes()
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
      query: {},
      session: {
        createJourney: {
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          riskLevel: 'High',
          educationLevels: [
            {
              educationLevelCode: '1',
              educationLevelDescription: 'Reading Measure 1.0',
            },
            {
              educationLevelCode: '1.1',
              educationLevelDescription: 'Reading Measure 1.1',
            },
          ],
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
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/check-education-level', {
        educationLevels: [
          {
            educationLevelCode: '1',
            educationLevelDescription: 'Reading Measure 1.0',
          },
          {
            educationLevelCode: '1.1',
            educationLevelDescription: 'Reading Measure 1.1',
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should add the minimum incentive level to the session and redirect', async () => {
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('start-date')
    })
  })
})
