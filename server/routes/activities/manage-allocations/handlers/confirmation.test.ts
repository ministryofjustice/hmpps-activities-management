import { Request, Response } from 'express'
import { when } from 'jest-when'
import ConfirmationRoutes from './confirmation'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import { AllocateToActivityJourney } from '../journey'
import ActivitiesService from '../../../../services/activitiesService'
import config from '../../../../config'
import atLeast from '../../../../../jest.setup'
import { PrisonerAllocations } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/metricsService')
jest.mock('../../../../services/activitiesService')

const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocate - Confirmation', () => {
  const handler = new ConfirmationRoutes(metricsService, activitiesService)
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

    when(activitiesService.getActivePrisonPrisonerAllocations)
      .calledWith(atLeast(['ABC123']))
      .mockResolvedValue([
        {
          prisonerNumber: 'ABC123',
          allocations: [
            { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
            { activityId: 2, scheduleId: 2, scheduleDescription: 'Unemployment', isUnemployment: true },
          ],
        },
      ] as PrisonerAllocations[])

    config.deallocationAfterAllocationToggleEnabled = true
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page with data from session - flag off', async () => {
      config.deallocationAfterAllocationToggleEnabled = false

      await handler.GET(req, res)
      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.CREATE_ALLOCATION_JOURNEY_COMPLETED(allocateJourney, res.locals.user).addJourneyCompletedMetrics(
          req,
        ),
      )
      expect(activitiesService.getActivePrisonPrisonerAllocations).not.toHaveBeenCalled()

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/confirmation', {
        activityId: 1,
        prisonerName: 'Joe Bloggs',
        prisonerNumber: 'ABC123',
        activityName: 'Maths',
        otherAllocations: null,
        deallocateMultipleActivitiesMode: false,
      })
    })
    it('should record create journey complete in metrics', async () => {
      await handler.GET(req, res)
      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.CREATE_ALLOCATION_JOURNEY_COMPLETED(allocateJourney, res.locals.user).addJourneyCompletedMetrics(
          req,
        ),
      )
    })
    it('should render page with data from session - flag on', async () => {
      config.deallocationAfterAllocationToggleEnabled = true
      req.params.mode = 'create'
      await handler.GET(req, res)
      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.CREATE_ALLOCATION_JOURNEY_COMPLETED(allocateJourney, res.locals.user).addJourneyCompletedMetrics(
          req,
        ),
      )
      expect(activitiesService.getActivePrisonPrisonerAllocations).toHaveBeenCalledWith(['ABC123'], res.locals.user)

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/confirmation', {
        activityId: 1,
        prisonerName: 'Joe Bloggs',
        prisonerNumber: 'ABC123',
        activityName: 'Maths',
        otherAllocations: [{ activityId: 2, scheduleId: 2, scheduleDescription: 'Unemployment', isUnemployment: true }],
        deallocateMultipleActivitiesMode: false,
      })
    })
    it('should render page with data from session - flag on - one activity removed', async () => {
      config.deallocationAfterAllocationToggleEnabled = true
      req.params.mode = 'remove'
      await handler.GET(req, res)

      expect(metricsService.trackEvent).not.toHaveBeenCalled()
      expect(activitiesService.getActivePrisonPrisonerAllocations).not.toHaveBeenCalled()

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/confirmation', {
        activityId: 1,
        prisonerName: 'Joe Bloggs',
        prisonerNumber: 'ABC123',
        activityName: 'Maths',
        otherAllocations: null,
        deallocateMultipleActivitiesMode: false,
      })
    })
    it('should render page with data from session - flag on - multiple activities removed', async () => {
      config.deallocationAfterAllocationToggleEnabled = true
      req.params.mode = 'remove'
      req.session.allocateJourney.activity = null
      req.session.allocateJourney.activitiesToDeallocate = [
        {
          activityId: 1,
          scheduleId: 1,
          name: 'Maths',
          location: 'Education room 1',
          startDate: '',
        },
        {
          activityId: 2,
          scheduleId: 2,
          name: 'English',
          location: 'Education room 2',
          startDate: '',
        },
      ]
      await handler.GET(req, res)

      expect(metricsService.trackEvent).not.toHaveBeenCalled()
      expect(activitiesService.getActivePrisonPrisonerAllocations).not.toHaveBeenCalled()

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/confirmation', {
        activityId: undefined,
        prisonerName: 'Joe Bloggs',
        prisonerNumber: 'ABC123',
        activityName: '2 activities',
        otherAllocations: null,
        deallocateMultipleActivitiesMode: true,
      })
    })

    it('should not record create journey complete in metrics when in the remove journey', async () => {
      req.params.mode = 'remove'
      await handler.GET(req, res)
      expect(metricsService.trackEvent).not.toHaveBeenCalled()
    })
  })
})
