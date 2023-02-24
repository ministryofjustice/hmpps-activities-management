import { Request, Response } from 'express'
import { UnlockFilterItem, UnlockFilters } from '../../../@types/activities'
import { toDate, formatDate } from '../../../utils/utils'
import PlannedEventRoutes from './plannedEvents'
import ActivitiesService from '../../../services/activitiesService'
import UnlockListService from '../../../services/unlockListService'
import { LocationGroup } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/unlockListService')

const activitiesService = new ActivitiesService(null, null, null) as jest.Mocked<ActivitiesService>
const unlockListService = new UnlockListService(null, null, null) as jest.Mocked<UnlockListService>

describe('Unlock list routes - planned events', () => {
  const handler = new PlannedEventRoutes(activitiesService, unlockListService)

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
      redirect: jest.fn(),
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
        session: {}, // No filters supplied in session
      } as unknown as Request

      // Mocked responses
      activitiesService.getLocationPrefix.mockResolvedValue({ locationPrefix: 'MDI-1-' })
      activitiesService.getLocationGroups.mockResolvedValue(locationsAtPrison)
      unlockListService.getFilteredUnlockList.mockResolvedValue([])

      await handler.GET(req, res)

      const { unlockFilters } = req.session

      expect(unlockListService.getFilteredUnlockList).toHaveBeenCalledWith(unlockFilters, res.locals.user)
      expect(res.render).toHaveBeenCalledWith('pages/unlock-list/planned-events', {
        unlockFilters,
        unlockListItems: [],
      })
    })

    it('should render the view from session filters - A-Wing selected', async () => {
      const locationFilters = [{ value: 'A-Wing', text: 'A-Wing', checked: true }] as UnlockFilterItem[]
      req = {
        query: {
          date: '2022-01-01',
          slot: 'am',
          location: 'Houseblock 1',
        },
        session: {
          unlockFilters: testUnlockFilters(locationFilters),
        },
      } as unknown as Request

      // Mocked responses
      activitiesService.getLocationGroups.mockResolvedValue(locationsAtPrison)
      activitiesService.getLocationPrefix.mockResolvedValue({ locationPrefix: 'MDI-1-' })
      unlockListService.getFilteredUnlockList.mockResolvedValue([])

      await handler.GET(req, res)

      const { unlockFilters } = req.session

      expect(unlockFilters.locationFilters.includes({ value: 'A-Wing', text: 'A-Wing', checked: true }))

      // Not called as filters already present in the session
      expect(activitiesService.getLocationGroups).not.toHaveBeenCalled()
      expect(activitiesService.getLocationPrefix).not.toHaveBeenCalled()

      expect(unlockListService.getFilteredUnlockList).toHaveBeenCalledWith(unlockFilters, res.locals.user)
      expect(res.render).toHaveBeenCalledWith('pages/unlock-list/planned-events', {
        unlockFilters,
        unlockListItems: [],
      })
    })
  })

  describe('POST', () => {
    it('no filters in session - redirect to select-date-and-location', async () => {
      req = {
        query: {
          date: '2022-01-01',
          slot: 'am',
          location: 'Houseblock 1',
        },
        body: {
          locationFilters: 'A-Wing',
          activityFilters: 'Both',
          stayingOrLeavingFilters: 'Both',
        },
        session: {},
      } as unknown as Request

      await handler.POST(req, res)

      const { unlockFilters } = req.session

      expect(unlockFilters).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith('select-date-and-location')
    })

    it('should update location filters to A-Wing and C-Wing', async () => {
      req = {
        query: {
          date: '2022-01-01',
          slot: 'am',
          location: 'Houseblock 1',
        },
        body: {
          locationFilters: ['A-Wing', 'C-Wing'],
        },
        session: {
          unlockFilters: testUnlockFilters(),
        },
      } as unknown as Request

      await handler.POST(req, res)

      const { unlockFilters } = req.session

      // Different from default filter values
      expect(unlockFilters.locationFilters.includes({ value: 'A-Wing', text: 'A-Wing', checked: true }))
      expect(unlockFilters.locationFilters.includes({ value: 'B-Wing', text: 'B-Wing', checked: false }))
      expect(unlockFilters.locationFilters.includes({ value: 'C-Wing', text: 'C-Wing', checked: true }))

      expect(res.redirect).toHaveBeenCalledWith(
        `planned-events?date=${formatDate(unlockFilters.unlockDate, 'yyyy-MM-dd')}` +
          `&slot=${unlockFilters.timeSlot}&location=${unlockFilters.location}`,
      )
    })

    it('should update activity filters to "With"', async () => {
      req = {
        query: {
          date: '2022-01-01',
          slot: 'am',
          location: 'Houseblock 1',
        },
        body: {
          activityFilters: 'With',
        },
        session: {
          unlockFilters: testUnlockFilters(),
        },
      } as unknown as Request

      await handler.POST(req, res)

      const { unlockFilters } = req.session

      // Different from the default filter values
      expect(unlockFilters.activityFilters.includes({ value: 'Both', text: 'Both', checked: false }))
      expect(unlockFilters.activityFilters.includes({ value: 'With', text: 'With', checked: true }))
      expect(unlockFilters.activityFilters.includes({ value: 'Without', text: 'Without', checked: false }))

      expect(res.redirect).toHaveBeenCalledWith(
        `planned-events?date=${formatDate(unlockFilters.unlockDate, 'yyyy-MM-dd')}` +
          `&slot=${unlockFilters.timeSlot}&location=${unlockFilters.location}`,
      )
    })

    it('should update staying or leaving filters to "Staying"', async () => {
      req = {
        query: {
          date: '2022-01-01',
          slot: 'am',
          location: 'Houseblock 1',
        },
        body: {
          stayingOrLeavingFilters: 'Staying',
        },
        session: {
          unlockFilters: testUnlockFilters(),
        },
      } as unknown as Request

      await handler.POST(req, res)

      const { unlockFilters } = req.session

      // Different from the default filter values
      expect(unlockFilters.stayingOrLeavingFilters.includes({ value: 'Both', text: 'Both', checked: false }))
      expect(unlockFilters.stayingOrLeavingFilters.includes({ value: 'Staying', text: 'Staying', checked: true }))
      expect(unlockFilters.stayingOrLeavingFilters.includes({ value: 'Leaving', text: 'Leaving', checked: false }))

      expect(res.redirect).toHaveBeenCalledWith(
        `planned-events?date=${formatDate(unlockFilters.unlockDate, 'yyyy-MM-dd')}` +
          `&slot=${unlockFilters.timeSlot}&location=${unlockFilters.location}`,
      )
    })

    it('Empty body should maintain the same filters', async () => {
      req = {
        query: {
          date: '2022-01-01',
          slot: 'am',
          location: 'Houseblock 1',
        },
        body: {},
        session: {
          unlockFilters: testUnlockFilters(),
        },
      } as unknown as Request

      await handler.POST(req, res)

      const { unlockFilters } = req.session
      const { unlockDate, timeSlot, location } = unlockFilters
      const defaultFilters = testUnlockFilters()
      expect(unlockFilters).toEqual(defaultFilters)
      expect(res.redirect).toHaveBeenCalledWith(
        `planned-events?date=${formatDate(unlockDate, 'yyyy-MM-dd')}&slot=${timeSlot}&location=${location}`,
      )
    })
  })

  describe('FILTERS', () => {
    it('no filters in session - redirect to first unlock form', async () => {
      req = {
        query: { clearFilters: true },
        session: {},
      } as unknown as Request

      await handler.FILTERS(req, res)

      const { unlockFilters } = req.session
      expect(unlockFilters).toBeUndefined()
      expect(res.redirect).toHaveBeenCalledWith('select-date-and-location')
    })

    it('clear all filters - sets filters to default values', async () => {
      const locationFilters = [
        { value: 'A-Wing', text: 'A-Wing', checked: true },
        { value: 'B-Wing', text: 'B-Wing', checked: false },
        { value: 'C-Wing', text: 'C-Wing', checked: false },
      ] as UnlockFilterItem[]

      req = {
        query: { clearFilters: true },
        session: {
          unlockFilters: testUnlockFilters(locationFilters),
        },
      } as unknown as Request

      await handler.FILTERS(req, res)

      const { unlockFilters } = req.session
      expect(unlockFilters).toBeDefined()
      expect(unlockFilters).toEqual(testUnlockFilters())

      const { unlockDate, timeSlot, location } = unlockFilters
      expect(res.redirect).toHaveBeenCalledWith(
        `planned-events?date=${formatDate(unlockDate, 'yyyy-MM-dd')}&slot=${timeSlot}&location=${location}`,
      )
    })

    it('Clear a location filter', async () => {
      req = {
        query: { clearLocation: 'A-Wing' },
        session: { unlockFilters: testUnlockFilters() },
      } as unknown as Request

      await handler.FILTERS(req, res)

      const { unlockFilters } = req.session
      expect(unlockFilters).toBeDefined()
      expect(unlockFilters.locationFilters.filter(loc => loc.checked === true).map(loc => loc.value)).toEqual([
        'B-Wing',
        'C-Wing',
      ])

      const { unlockDate, timeSlot, location } = unlockFilters
      expect(res.redirect).toHaveBeenCalledWith(
        `planned-events?date=${formatDate(unlockDate, 'yyyy-MM-dd')}&slot=${timeSlot}&location=${location}`,
      )
    })

    it('Clear an activity filter', async () => {
      req = {
        query: { clearActivity: 'Both' },
        session: { unlockFilters: testUnlockFilters() },
      } as unknown as Request

      await handler.FILTERS(req, res)

      const { unlockFilters } = req.session

      expect(unlockFilters).toBeDefined()
      // Both is added back in whenever a radio option is cleared
      expect(
        unlockFilters.activityFilters.filter(loc => loc.checked === true).filter(loc => loc.value === 'Both'),
      ).toHaveLength(1)

      const { unlockDate, timeSlot, location } = unlockFilters
      expect(res.redirect).toHaveBeenCalledWith(
        `planned-events?date=${formatDate(unlockDate, 'yyyy-MM-dd')}&slot=${timeSlot}&location=${location}`,
      )
    })

    it('Clear a staying or leaving filter', async () => {
      req = {
        query: { clearStaying: 'Both' },
        session: { unlockFilters: testUnlockFilters() },
      } as unknown as Request

      await handler.FILTERS(req, res)

      const { unlockFilters } = req.session

      expect(unlockFilters).toBeDefined()
      // Both is added back in whenever a radio option is cleared
      expect(
        unlockFilters.activityFilters.filter(loc => loc.checked === true).filter(loc => loc.value === 'Both'),
      ).toHaveLength(1)
      const { unlockDate, timeSlot, location } = unlockFilters
      expect(res.redirect).toHaveBeenCalledWith(
        `planned-events?date=${formatDate(unlockDate, 'yyyy-MM-dd')}&slot=${timeSlot}&location=${location}`,
      )
    })
  })
})

const locationFiltersDefault = [
  { value: 'A-Wing', text: 'A-Wing', checked: true },
  { value: 'B-Wing', text: 'B-Wing', checked: true },
  { value: 'C-Wing', text: 'C-Wing', checked: true },
] as UnlockFilterItem[]

const activityFiltersDefault = [
  { value: 'Both', text: 'Both', checked: true },
  { value: 'With', text: 'With', checked: false },
  { value: 'Without', text: 'Without', checked: false },
] as UnlockFilterItem[]

const stayingOrLeavingFiltersDefault = [
  { value: 'Both', text: 'Both', checked: true },
  { value: 'Staying', text: 'Staying', checked: false },
  { value: 'Leaving', text: 'Leaving', checked: false },
] as UnlockFilterItem[]

const testUnlockFilters = (
  locationFilters: UnlockFilterItem[] = locationFiltersDefault,
  activityFilters: UnlockFilterItem[] = activityFiltersDefault,
  stayingOrLeavingFilters: UnlockFilterItem[] = stayingOrLeavingFiltersDefault,
): UnlockFilters => {
  return {
    location: 'Houseblock 1',
    cellPrefix: 'MDI-1-',
    unlockDate: toDate('2022-01-01'),
    timeSlot: 'am',
    subLocations: ['A-Wing', 'B-Wing', 'C-Wing'],
    locationFilters,
    activityFilters,
    stayingOrLeavingFilters,
  } as UnlockFilters
}
