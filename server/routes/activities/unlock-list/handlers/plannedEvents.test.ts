import { Request, Response } from 'express'
import { when } from 'jest-when'
import { UnlockListItem, YesNo } from '../../../../@types/activities'
import PlannedEventRoutes from './plannedEvents'
import ActivitiesService from '../../../../services/activitiesService'
import UnlockListService from '../../../../services/unlockListService'
import { ActivityCategory, LocationGroup } from '../../../../@types/activitiesAPI/types'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import AlertsFilterService from '../../../../services/alertsFilterService'
import activityCategories from '../../../../services/fixtures/activity_categories.json'
import { ActivityCategoryEnum } from '../../../../data/activityCategoryEnum'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/unlockListService')
jest.mock('../../../../services/alertsFilterService')
jest.mock('../../../../services/metricsService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const unlockListService = new UnlockListService(null, null, null) as jest.Mocked<UnlockListService>
const alertsFilterService = new AlertsFilterService() as jest.Mocked<AlertsFilterService>
const metricsService = new MetricsService() as jest.Mocked<MetricsService>
const activityCategoriesWithRotl = [
  ...activityCategories,
  {
    id: 10,
    code: ActivityCategoryEnum.SAA_ROTL,
    name: 'Outside activity',
    description: 'Activities which take place outside the prison',
  },
] as ActivityCategory[]

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
          externalActivitiesRolledOut: true,
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
        journeyData: {
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
      when(activitiesService.getActivityCategories)
        .calledWith(res.locals.user, true)
        .mockResolvedValue(activityCategoriesWithRotl)

      await handler.GET(req, res)

      expect(unlockListService.getFilteredUnlockList).toHaveBeenCalledWith(
        new Date('2022-01-01'),
        'AM',
        'A',
        ['A', 'B', 'C'],
        'With',
        [
          'SAA_EDUCATION',
          'SAA_INDUSTRIES',
          'SAA_PRISON_JOBS',
          'SAA_GYM_SPORTS_FITNESS',
          'SAA_INDUCTION',
          'SAA_INTERVENTIONS',
          'SAA_FAITH_SPIRITUALITY',
          'SAA_NOT_IN_WORK',
          'SAA_OTHER',
          ActivityCategoryEnum.SAA_ROTL,
        ],
        'Both',
        ['ALERT_HA'],
        '',
        YesNo.YES,
        false,
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
        activityCategories: activityCategoriesWithRotl,
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
        journeyData: {
          unlockListJourney: {
            locationKey: 'A',
            timeSlot: 'AM',
            stayingOrLeavingFilter: 'Leaving',
            activityFilter: 'With',
            subLocationFilters: ['A'],
            searchTerm: 'search term',
            alertFilters: ['CAT_A'],
            cancelledEventsFilter: YesNo.YES,
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
      when(activitiesService.getActivityCategories)
        .calledWith(res.locals.user, true)
        .mockResolvedValue(activityCategoriesWithRotl)

      await handler.GET(req, res)

      expect(unlockListService.getFilteredUnlockList).toHaveBeenCalledWith(
        new Date('2022-01-01'),
        'AM',
        'A',
        ['A'],
        'With',
        [
          'SAA_EDUCATION',
          'SAA_INDUSTRIES',
          'SAA_PRISON_JOBS',
          'SAA_GYM_SPORTS_FITNESS',
          'SAA_INDUCTION',
          'SAA_INTERVENTIONS',
          'SAA_FAITH_SPIRITUALITY',
          'SAA_NOT_IN_WORK',
          'SAA_OTHER',
          ActivityCategoryEnum.SAA_ROTL,
        ],
        'Leaving',
        ['CAT_A'],
        'search term',
        YesNo.YES,
        false,
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
        activityCategories: activityCategoriesWithRotl,
        timeSlot: 'AM',
        unlockListItems,
        movementCounts: {
          leavingWing: 2,
          stayingOnWing: 0,
        },
        alertOptions: alertFilterOptions,
      })
    })

    it('should not request the ROTL category when external activities are not rolled out', async () => {
      res.locals.user.externalActivitiesRolledOut = false
      req = {
        query: { date: '2022-01-01' },
        journeyData: {
          unlockListJourney: {
            locationKey: 'A',
            timeSlot: 'AM',
          },
        },
      } as unknown as Request

      when(activitiesService.getLocationGroups).mockResolvedValue(locationsAtPrison)
      when(activitiesService.getActivityCategories)
        .calledWith(res.locals.user, false)
        .mockResolvedValue(activityCategories as ActivityCategory[])
      when(unlockListService.getFilteredUnlockList).mockResolvedValue([])
      when(alertsFilterService.getAllAlertFilterOptions).mockReturnValue([])

      await handler.GET(req, res)

      expect(activitiesService.getActivityCategories).toHaveBeenCalledWith(res.locals.user, false)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/unlock-list/planned-events',
        expect.objectContaining({ activityCategories }),
      )
    })

    it('should pass true into function call if the user has selected/removed any activity category filters', async () => {
      req = {
        query: {
          date: '2022-01-01',
        },
        journeyData: {
          unlockListJourney: {
            locationKey: 'A',
            timeSlot: 'AM',
            stayingOrLeavingFilter: 'Leaving',
            activityFilter: 'With',
            subLocationFilters: ['A'],
            searchTerm: 'search term',
            alertFilters: ['CAT_A'],
            cancelledEventsFilter: YesNo.YES,
            activityCategoriesFilters: ['SAA_EDUCATION'],
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
      when(alertsFilterService.getAllAlertFilterOptions).mockReturnValue([
        { key: 'CAT_A', description: 'CAT A', codes: ['A', 'E'] },
      ])
      when(activitiesService.getActivityCategories)
        .calledWith(res.locals.user, true)
        .mockResolvedValue(activityCategoriesWithRotl)

      await handler.GET(req, res)

      expect(unlockListService.getFilteredUnlockList).toHaveBeenCalledWith(
        new Date('2022-01-01'),
        'AM',
        'A',
        ['A'],
        'With',
        ['SAA_EDUCATION'],
        'Leaving',
        ['CAT_A'],
        'search term',
        YesNo.YES,
        true,
        res.locals.user,
      )
    })
  })
})
