import { Request, Response } from 'express'
import PlannedEventRoutes from './plannedEvents'
import ActivitiesService from '../../../services/activitiesService'
import UnlockListService from '../../../services/unlockListService'
import { UnlockFilterItem, UnlockFilters } from '../../../@types/activities'
import { LocationGroup } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/unlockListService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
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
        { name: 'Segregation Unit', key: 'Segregation Unit', children: [] },
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
    it('should render the expected view - default filters', async () => {
      req = {
        query: {
          datePresetOption: 'today',
          date: '2022-01-01',
          slot: 'am',
          location: 'Houseblock 1',
        },
        session: {}, // No filters supplied in session
      } as unknown as Request

      activitiesService.getLocationGroups.mockResolvedValue(locationsAtPrison)
      unlockListService.getFilteredUnlockList.mockResolvedValue([])

      await handler.GET(req, res)

      // Default filters are populated in the session by the route handler
      const { unlockFilters } = req.session

      expect(unlockListService.getFilteredUnlockList).toHaveBeenCalledWith(
        req.query.location,
        ['A-Wing', 'B-Wing', 'C-Wing'],
        unlockFilters,
        req.query.date,
        req.query.slot,
        res.locals.user,
      )

      expect(res.render).toHaveBeenCalledWith('pages/unlock-list/planned-events', {
        locationGroup: req.query.location,
        unlockFilters,
        unlockListItems: [],
        plannedDate: 'Saturday 1st January 2022',
        plannedSlot: 'am',
      })
    })

    it('should render the expected view - filtered by sub location A-Wing', async () => {
      const testUnlockFilters = (): UnlockFilters => {
        const subLocations = [
          { value: 'All', text: 'All', checked: false } as UnlockFilterItem,
          { value: 'A-Wing', text: 'A-Wing', checked: true } as UnlockFilterItem,
          { value: 'B-Wing', text: 'B-Wing', checked: false } as UnlockFilterItem,
          { value: 'C-Wing', text: 'C-Wing', checked: false } as UnlockFilterItem,
        ]
        const activityNames = [{ value: 'All', text: 'All', checked: true }] as UnlockFilterItem[]
        const stayingOrLeaving = [{ value: 'All', text: 'All', checked: true }] as UnlockFilterItem[]
        return { subLocations, activityNames, stayingOrLeaving }
      }

      req = {
        query: {
          datePresetOption: 'today',
          date: '2022-01-01',
          slot: 'am',
          location: 'Houseblock 1',
        },
        session: {
          unlockFilters: testUnlockFilters(),
        },
      } as unknown as Request

      activitiesService.getLocationGroups.mockResolvedValue(locationsAtPrison)
      unlockListService.getFilteredUnlockList.mockResolvedValue([])

      await handler.GET(req, res)

      // Specified filters will be populated in the session by the route handler
      const { unlockFilters } = req.session

      expect(unlockListService.getFilteredUnlockList).toHaveBeenCalledWith(
        req.query.location,
        ['A-Wing', 'B-Wing', 'C-Wing'],
        unlockFilters,
        req.query.date,
        req.query.slot,
        res.locals.user,
      )

      expect(res.render).toHaveBeenCalledWith('pages/unlock-list/planned-events', {
        locationGroup: req.query.location,
        unlockFilters,
        unlockListItems: [],
        plannedDate: 'Saturday 1st January 2022',
        plannedSlot: 'am',
      })
    })
  })
})
