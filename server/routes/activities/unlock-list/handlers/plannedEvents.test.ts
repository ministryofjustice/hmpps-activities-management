import { Request, Response } from 'express'
import { when } from 'jest-when'
import { UnlockListItem } from '../../../../@types/activities'
import PlannedEventRoutes from './plannedEvents'
import ActivitiesService from '../../../../services/activitiesService'
import UnlockListService from '../../../../services/unlockListService'
import { LocationGroup } from '../../../../@types/activitiesAPI/types'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import AlertsFilterService from '../../../../services/alertsFilterService'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/unlockListService')
jest.mock('../../../../services/alertsFilterService')
jest.mock('../../../../services/metricsService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const unlockListService = new UnlockListService(null, null, null) as jest.Mocked<UnlockListService>
const alertsFilterService = new AlertsFilterService() as jest.Mocked<AlertsFilterService>
const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Unlock list routes - planned events', () => {
  const handler = new PlannedEventRoutes(activitiesService, unlockListService, metricsService, alertsFilterService)

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
        },
        session: {
          unlockListJourney: {
            locationKey: 'A',
            timeSlot: 'AM',
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

      const alertFilterOptions = [{ key: 'ALERT_HA', description: 'ACCT', codes: ['HA'] }]

      when(activitiesService.getLocationGroups).mockResolvedValue(locationsAtPrison)
      when(unlockListService.getFilteredUnlockList).mockResolvedValue(unlockListItems)
      when(alertsFilterService.getAllAlertFilterOptions).mockReturnValue(alertFilterOptions)

      await handler.GET(req, res)

      expect(unlockListService.getFilteredUnlockList).toHaveBeenCalledWith(
        new Date('2022-01-01'),
        'AM',
        'A',
        ['A', 'B', 'C'],
        'With',
        'Both',
        ['ALERT_HA'],
        '',
        res.locals.user,
      )

      expect(res.render).toHaveBeenCalledWith('pages/activities/unlock-list/planned-events', {
        date: '2022-01-01',
        location: {
          name: 'A-Wing',
          key: 'A',
          children: [
            { name: 'A-Wing', key: 'A', children: [] },
            { name: 'B-Wing', key: 'B', children: [] },
            { name: 'C-Wing', key: 'C', children: [] },
          ],
        },
        timeSlot: 'AM',
        unlockListItems,
        movementCounts: {
          leavingWing: 2,
          stayingOnWing: 1,
        },
        alertOptions: alertFilterOptions,
      })
    })

    it('should render the view from session filters', async () => {
      const alertFilterOptions = [{ key: 'CAT_A', description: 'CAT A', codes: ['A', 'E'] }]

      req = {
        query: {
          date: '2022-01-01',
        },
        session: {
          unlockListJourney: {
            locationKey: 'A',
            timeSlot: 'AM',
            stayingOrLeavingFilter: 'Leaving',
            activityFilter: 'With',
            subLocationFilters: ['A'],
            searchTerm: 'search term',
            alertFilters: ['CAT_A'],
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
      when(alertsFilterService.getAllAlertFilterOptions).mockReturnValue(alertFilterOptions)

      await handler.GET(req, res)

      expect(unlockListService.getFilteredUnlockList).toHaveBeenCalledWith(
        new Date('2022-01-01'),
        'AM',
        'A',
        ['A'],
        'With',
        'Leaving',
        ['CAT_A'],
        'search term',
        res.locals.user,
      )

      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.CREATE_UNLOCK_LIST(new Date('2022-01-01'), 'AM', 'A-Wing', 2, res.locals.user),
      )

      expect(res.render).toHaveBeenCalledWith('pages/activities/unlock-list/planned-events', {
        date: '2022-01-01',
        location: {
          name: 'A-Wing',
          key: 'A',
          children: [
            { name: 'A-Wing', key: 'A', children: [] },
            { name: 'B-Wing', key: 'B', children: [] },
            { name: 'C-Wing', key: 'C', children: [] },
          ],
        },
        timeSlot: 'AM',
        unlockListItems,
        movementCounts: {
          leavingWing: 2,
          stayingOnWing: 0,
        },
        alertOptions: alertFilterOptions,
      })
    })
  })
})
