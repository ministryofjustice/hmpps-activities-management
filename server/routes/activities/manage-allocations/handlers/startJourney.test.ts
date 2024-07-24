import { Request, Response } from 'express'
import { when } from 'jest-when'
import atLeast from '../../../../../jest.setup'
import ActivitiesService from '../../../../services/activitiesService'
import StartJourneyRoutes from './startJourney'
import PrisonService from '../../../../services/prisonService'
import { ActivitySchedule } from '../../../../@types/activitiesAPI/types'
import { IepSummary } from '../../../../@types/incentivesApi/types'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import findNextSchedulesInstance from '../../../../utils/helpers/nextScheduledInstanceCalculator'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/metricsService')
jest.mock('../../../../utils/helpers/nextScheduledInstanceCalculator')

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
          activeCaseLoadId: 'LEI',
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
    it('should populate the session with journey data and redirect to the before you allocate page', async () => {
      when(prisonService.getInmateByPrisonerNumber)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({
          prisonerNumber: 'ABC123',
          firstName: 'Joe',
          lastName: 'Bloggs',
          cellLocation: '1-2-001',
          prisonId: 'LEI',
          status: 'ACTIVE IN',
        } as Prisoner)

      when(prisonService.getPrisonerIepSummary)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({
          iepLevel: 'Standard',
        } as IepSummary)

      const schedule = {
        id: 1,
        activity: {
          id: 1,
          onWing: true,
          offWing: false,
          inCell: false,
          paid: true,
        },
        description: 'Maths',
        internalLocation: { description: 'Education room 1' },
        startDate: '2023-07-26',
        endDate: '2023-08-26',
        scheduleWeeks: 2,
        instances: [
          {
            id: 123,
          },
        ],
      } as unknown as ActivitySchedule

      when(activitiesService.getActivitySchedule).calledWith(atLeast(1)).mockResolvedValue(schedule)

      when(findNextSchedulesInstance).calledWith(schedule).mockReturnValue(schedule.instances[0])

      await handler.GET(req, res)

      expect(req.session.allocateJourney).toEqual({
        exclusions: [],
        updatedExclusions: [],
        inmates: [
          {
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            cellLocation: '1-2-001',
            incentiveLevel: 'Standard',
            prisonCode: 'LEI',
            status: 'ACTIVE IN',
          },
        ],
        inmate: {
          prisonerNumber: 'ABC123',
          prisonerName: 'Joe Bloggs',
          cellLocation: '1-2-001',
          incentiveLevel: 'Standard',
          prisonCode: 'LEI',
          status: 'ACTIVE IN',
        },
        activity: {
          activityId: 1,
          scheduleId: 1,
          scheduleWeeks: 2,
          name: 'Maths',
          location: 'Education room 1',
          startDate: '2023-07-26',
          endDate: '2023-08-26',
          offWing: false,
          onWing: true,
          inCell: false,
          paid: true,
        },
        scheduledInstance: {
          id: 123,
        },
      })
      expect(metricsService.trackEvent).toBeCalledWith(
        MetricsEvent.CREATE_ALLOCATION_JOURNEY_STARTED(res.locals.user).addJourneyStartedMetrics(req),
      )
      expect(res.redirect).toHaveBeenCalledWith('../before-you-allocate')
    })

    it('should populate the session with journey data and redirect to the allocation error page if prisoner is in another prison', async () => {
      when(prisonService.getInmateByPrisonerNumber)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValueOnce({
          prisonerNumber: 'ABC123',
          firstName: 'Joe',
          lastName: 'Bloggs',
          cellLocation: '1-2-001',
          prisonId: 'MDI',
        } as Prisoner)

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('../error/transferred')
    })
  })
})
