import { Request, Response } from 'express'
import ConfirmationRoutes from './confirmation'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import { SuspendJourney } from '../journey'

jest.mock('../../../../services/metricsService')

const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Suspensions - Confirmation', () => {
  const handler = new ConfirmationRoutes(metricsService)
  let req: Request
  let res: Response

  const suspendJourney = {
    allocations: [
      {
        activityName: 'Activity 1',
        allocationId: 1,
      },
      {
        activityName: 'Activity 2',
        allocationId: 2,
      },
    ],
    earliestAllocationEndDate: '2024-06-02',
    inmate: {
      prisonerName: 'John Smith',
      prisonerNumber: 'ABC123',
    },
  } as SuspendJourney

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
      params: { mode: 'create' },
      session: {
        suspendJourney,
        journeyMetrics: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page with data from session', async () => {
      await handler.GET(req, res)
      expect(metricsService.trackEvent).toBeCalledWith(
        MetricsEvent.SUSPEND_ALLOCATION_JOURNEY_COMPLETED(suspendJourney, res.locals.user).addJourneyCompletedMetrics(
          req,
        ),
      )
      expect(res.render).toHaveBeenCalledWith('pages/activities/suspensions/confirmation')
    })

    it('should record suspend journey complete in metrics', async () => {
      await handler.GET(req, res)
      expect(metricsService.trackEvent).toBeCalledWith(
        MetricsEvent.SUSPEND_ALLOCATION_JOURNEY_COMPLETED(suspendJourney, res.locals.user).addJourneyCompletedMetrics(
          req,
        ),
      )
    })
  })
})
