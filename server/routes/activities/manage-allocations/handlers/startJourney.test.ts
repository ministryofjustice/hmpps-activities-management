import { Request, Response } from 'express'
import { when } from 'jest-when'
import atLeast from '../../../../../jest.setup'
import ActivitiesService from '../../../../services/activitiesService'
import StartJourneyRoutes from './startJourney'
import PrisonService from '../../../../services/prisonService'
import { InmateDetail } from '../../../../@types/prisonApiImport/types'
import { ActivitySchedule } from '../../../../@types/activitiesAPI/types'
import { IepSummary } from '../../../../@types/incentivesApi/types'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/metricsService')

const prisonService = new PrisonService(null, null, null)
const activitiesService = new ActivitiesService(null)
const metricsService = new MetricsService(null)

describe('Route Handlers - Allocate - Start', () => {
  const handler = new StartJourneyRoutes(prisonService, activitiesService, metricsService)
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
      query: { scheduleId: '1' },
      params: { prisonerNumber: 'ABC123' },
      session: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should populate the session with journey data and redirect to the pay band page', async () => {
      when(prisonService.getInmate)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({
          offenderNo: 'ABC123',
          firstName: 'Joe',
          lastName: 'Bloggs',
          assignedLivingUnit: { description: '1-2-001' },
        } as InmateDetail)

      when(prisonService.getPrisonerIepSummary)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({
          iepLevel: 'Standard',
        } as IepSummary)

      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          id: 1,
          activity: { id: 1 },
          description: 'Maths',
          internalLocation: { description: 'Education room 1' },
          startDate: '2023-07-26',
        } as unknown as ActivitySchedule)

      await handler.GET(req, res)

      expect(req.session.allocateJourney).toEqual({
        inmates: [
          {
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            cellLocation: '1-2-001',
            incentiveLevel: 'Standard',
          },
        ],
        inmate: {
          prisonerNumber: 'ABC123',
          prisonerName: 'Joe Bloggs',
          cellLocation: '1-2-001',
          incentiveLevel: 'Standard',
        },
        activity: {
          activityId: 1,
          scheduleId: 1,
          name: 'Maths',
          location: 'Education room 1',
          startDate: '2023-07-26',
        },
      })
      expect(metricsService.trackEvent).toBeCalledWith(
        MetricsEvent.CREATE_ALLOCATION_JOURNEY_STARTED(res.locals.user).addJourneyStartedMetrics(req),
      )
      expect(res.redirect).toHaveBeenCalledWith('../before-you-allocate')
    })
  })
})