import { Request, Response } from 'express'
import StartJourneyRoutes from './startJourney'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

jest.mock('../../../../services/metricsService')

const metricsService = new MetricsService(null)

describe('Route Handlers - Create an activity - Start', () => {
  const handler = new StartJourneyRoutes(metricsService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
      session: {},
      query: { preserveHistory: 'true' },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should populate the session with journey data and redirect to the pay band page', async () => {
      await handler.GET(req, res)

      expect(req.session.createJourney).toEqual({})
      expect(metricsService.trackEvent).toBeCalledWith(
        MetricsEvent.CREATE_ACTIVITY_JOURNEY_STARTED(res.locals.user).addJourneyStartedMetrics(req),
      )
      expect(res.redirect).toHaveBeenCalledWith('category?preserveHistory=true')
    })
  })
})
