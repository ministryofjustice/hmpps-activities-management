import { Request, Response } from 'express'

import RemoveEducationLevelRoutes from './removeEducationLevel'

describe('Route Handlers - Create an activity - Remove pay', () => {
  const handler = new RemoveEducationLevelRoutes()
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
          incentiveLevels: ['Basic', 'Standard'],
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should remove specified education level and redirect', async () => {
      req.query = { code: '1.1' }
      await handler.GET(req, res)
      expect(req.session.createJourney.educationLevels).toEqual([
        {
          educationLevelCode: '1',
          educationLevelDescription: 'Reading Measure 1.0',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('check-education-level')
    })
  })
})
