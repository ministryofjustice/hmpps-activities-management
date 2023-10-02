import { Request, Response } from 'express'
import ConfirmationRoutes from './confirmation'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

jest.mock('../../../../services/metricsService')

const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Create an activity - Confirmation', () => {
  const handler = new ConfirmationRoutes(metricsService)
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
      session: {
        createJourney: {},
        journeyMetrics: {},
      },
      params: {
        id: '1',
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/confirmation', { id: '1' })
      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.CREATE_ACTIVITY_JOURNEY_COMPLETED(res.locals.user).addJourneyCompletedMetrics(req),
      )
      expect(req.session.createJourney).toBeNull()
    })
  })
})
