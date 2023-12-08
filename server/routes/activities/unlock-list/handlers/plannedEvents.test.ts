import { Request, Response } from 'express'
import { when } from 'jest-when'
import { UnlockListItem } from '../../../../@types/activities'
import PlannedEventRoutes from './plannedEvents'
import ActivitiesService from '../../../../services/activitiesService'
import UnlockListService from '../../../../services/unlockListService'
import { LocationGroup } from '../../../../@types/activitiesAPI/types'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/unlockListService')
jest.mock('../../../../services/metricsService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const unlockListService = new UnlockListService(null, null) as jest.Mocked<UnlockListService>
const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Unlock list routes - planned events', () => {
  const handler = new PlannedEventRoutes(activitiesService, unlockListService, metricsService)

  const locationsAtPrison = [
    {
      name: 'A-Wing',
      key: 'A',
      children: [
        { name: 'A-Wing', key: 'A', children: [] },
        { name: 'B-Wing', key: 'B', children: [] },
        { name: 'C-Wing', key: 'C', children: [] },
      ],
    },
    {
      name: 'B-Wing',
      key: 'B',
      children: [
        { name: 'A-Wing', key: 'A', children: [] },
        { name: 'B-Wing', key: 'B', children: [] },
      ],
    },
  ] as unknown as LocationGroup[]

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
    } as unknown as Response

    req = {} as unknown as Request

    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the view with default filters', async () => {
      req = {
        query: {
          date: '2022-01-01',
          slot: 'am',
          location: 'A',
        },
        session: {
          unlockListJourney: {
            location: 'A',
            timeSlot: 'am',
            // No filters supplied in session
          },
        },
      } as unknown as Request

      const unlockListItems = [
        {
          prisonerNumber: 'A1111AA',
          isLeavingWing: true,
        },
        {
          prisonerNumber: 'B2222BB',
          isLeavingWing: true,
        },
        {
          prisonerNumber: 'C3333CC',
          isLeavingWing: false,
        },
      ] as UnlockListItem[]

      when(activitiesService.getLocationGroups).mockResolvedValue(locationsAtPrison)
      when(unlockListService.getFilteredUnlockList).mockResolvedValue(unlockListItems)

      await handler.GET(req, res)

      expect(unlockListService.getFilteredUnlockList).toHaveBeenCalledWith(
        new Date('2022-01-01'),
        'am',
        'A',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'With',
        'Both',
        res.locals.user,
      )

      expect(res.render).toHaveBeenCalledWith('pages/activities/unlock-list/planned-events', {
        date: '2022-01-01',
        location: 'A',
        subLocations: ['A-Wing', 'B-Wing', 'C-Wing'],
        timeSlot: 'am',
        unlockListItems,
        movementCounts: {
          leavingWing: 2,
          stayingOnWing: 1,
        },
      })
    })

    it('should render the view from session filters', async () => {
      req = {
        query: {
          date: '2022-01-01',
          slot: 'am',
          location: 'A',
        },
        session: {
          unlockListJourney: {
            location: 'A',
            timeSlot: 'am',
            stayingOrLeavingFilter: 'Leaving',
            activityFilter: 'With',
            subLocationFilters: ['A-Wing'],
          },
        },
      } as unknown as Request

      const unlockListItems = [
        {
          prisonerNumber: 'A1111AA',
          isLeavingWing: true,
        },
        {
          prisonerNumber: 'B2222BB',
          isLeavingWing: true,
        },
      ] as UnlockListItem[]

      when(activitiesService.getLocationGroups).mockResolvedValue(locationsAtPrison)
      when(unlockListService.getFilteredUnlockList).mockResolvedValue(unlockListItems)

      await handler.GET(req, res)

      expect(unlockListService.getFilteredUnlockList).toHaveBeenCalledWith(
        new Date('2022-01-01'),
        'am',
        'A',
        ['A-Wing'],
        'With',
        'Leaving',
        res.locals.user,
      )

      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.CREATE_UNLOCK_LIST(new Date('2022-01-01'), 'am', 'A', res.locals.user),
      )

      expect(res.render).toHaveBeenCalledWith('pages/activities/unlock-list/planned-events', {
        date: '2022-01-01',
        location: 'A',
        subLocations: ['A-Wing', 'B-Wing', 'C-Wing'],
        timeSlot: 'am',
        unlockListItems,
        movementCounts: {
          leavingWing: 2,
          stayingOnWing: 0,
        },
      })
    })
  })
})
