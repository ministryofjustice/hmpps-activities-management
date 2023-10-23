import { Request, Response } from 'express'
import ConfirmationRoutes from './confirmation'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import { AllocateToActivityJourney } from '../journey'

jest.mock('../../../../services/metricsService')

const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Allocate - Confirmation', () => {
  const handler = new ConfirmationRoutes(metricsService)
  let req: Request
  let res: Response

  const allocateJourney = {
    inmate: {
      prisonerName: 'Joe Bloggs',
      prisonerNumber: 'ABC123',
      cellLocation: '1-2-001',
      payBand: {
        id: 1,
        alias: 'A',
        rate: 100,
      },
    },
    activity: {
      activityId: 1,
      scheduleId: 1,
      name: 'Maths',
      location: 'Education room 1',
    },
    startDate: '01/01/2023',
  } as AllocateToActivityJourney

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
        allocateJourney,
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
        MetricsEvent.CREATE_ALLOCATION_JOURNEY_COMPLETED(allocateJourney, res.locals.user).addJourneyCompletedMetrics(
          req,
        ),
      )
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/confirmation', {
        activityId: 1,
        prisonerName: 'Joe Bloggs',
        prisonerNumber: 'ABC123',
        activityName: 'Maths',
      })
      expect(req.session.allocateJourney).toBeNull()
    })

    it('should record create journey complete in metrics', async () => {
      await handler.GET(req, res)
      expect(metricsService.trackEvent).toBeCalledWith(
        MetricsEvent.CREATE_ALLOCATION_JOURNEY_COMPLETED(allocateJourney, res.locals.user).addJourneyCompletedMetrics(
          req,
        ),
      )
    })

    it('should not record create journey complete in metrics when in the remove journey', async () => {
      req.params.mode = 'remove'
      await handler.GET(req, res)
      expect(metricsService.trackEvent).not.toBeCalled()
    })
  })
})
