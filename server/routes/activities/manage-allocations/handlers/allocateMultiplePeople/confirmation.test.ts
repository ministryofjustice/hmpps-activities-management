import { Request, Response } from 'express'
import MetricsService from '../../../../../services/metricsService'
import ConfirmMultipleAllocationsRoutes from './confirmation'
import { AllocateToActivityJourney } from '../../journey'
import MetricsEvent from '../../../../../data/metricsEvent'

const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

jest.mock('../../../../../services/metricsService')

describe('Allocate multiple people - confirmation page', () => {
  const handler = new ConfirmMultipleAllocationsRoutes(metricsService)
  let req: Request
  let res: Response

  const allocateJourney = {
    inmates: [
      {
        prisonerName: 'Joe Bloggs',
        firstName: 'Joe',
        lastName: 'Bloggs',
        prisonerNumber: 'G3096GX',
        cellLocation: '1-2-001',
        payBand: {
          id: 1,
          alias: 'A',
          rate: 100,
        },
      },
      {
        prisonerName: 'Jane Cash',
        firstName: 'Jane',
        lastName: 'Cash',
        prisonerNumber: 'G4977UO',
        cellLocation: '2-2-002',
        payBand: {
          id: 2,
          alias: 'B',
          rate: 200,
        },
      },
    ],
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
      params: {},
      routeContext: { mode: 'create' },
      session: { journeyMetrics: {} },
      journeyData: {
        allocateJourney,
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should record create journey complete in metrics', async () => {
      await handler.GET(req, res)
      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.CREATE_MULTIPLE_ALLOCATION_JOURNEY_COMPLETED(
          allocateJourney,
          res.locals.user,
        ).addJourneyCompletedMetrics(req),
      )
    })
  })
})
