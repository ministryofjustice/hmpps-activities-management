import { Request, Response } from 'express'
import { when } from 'jest-when'
import { UnlockListItem } from '../../../../@types/activities'
import PlannedEventRoutes from './plannedEvents'
import ActivitiesService from '../../../../services/activitiesService'
import UnlockListService from '../../../../services/unlockListService'
import { LocationGroup } from '../../../../@types/activitiesAPI/types'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/MetricsEvent'

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
      name: 'Houseblock 1',
      key: 'Houseblock 1',
      children: [
        { name: 'A-Wing', key: 'A-Wing', children: [] },
        { name: 'B-Wing', key: 'B-Wing', children: [] },
        { name: 'C-Wing', key: 'C-Wing', children: [] },
      ],
    },
    {
      name: 'Houseblock 2',
      key: 'Houseblock 2',
      children: [
        { name: 'A-Wing', key: 'A-Wing', children: [] },
        { name: 'B-Wing', key: 'B-Wing', children: [] },
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
          location: 'Houseblock 1',
        },
        session: {
          unlockListJourney: {
            location: 'Houseblock 1',
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
        'Houseblock 1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'Both',
        'Both',
        res.locals.user,
      )

      expect(res.render).toHaveBeenCalledWith('pages/activities/unlock-list/planned-events', {
        date: '2022-01-01',
        location: 'Houseblock 1',
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
          location: 'Houseblock 1',
        },
        session: {
          unlockListJourney: {
            location: 'Houseblock 1',
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
        'Houseblock 1',
        ['A-Wing'],
        'With',
        'Leaving',
        res.locals.user,
      )

      expect(metricsService.trackEvent).toHaveBeenCalledWith(MetricsEvent.UNLOCK_LIST_GENERATED(res.locals.user))

      expect(res.render).toHaveBeenCalledWith('pages/activities/unlock-list/planned-events', {
        date: '2022-01-01',
        location: 'Houseblock 1',
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
