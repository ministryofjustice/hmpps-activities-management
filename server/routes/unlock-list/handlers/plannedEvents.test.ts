import { Request, Response } from 'express'
import PlannedEventRoutes from './plannedEvents'
import ActivitiesService from '../../../services/activitiesService'
import UnlockListService from '../../../services/unlockListService'
import { UnlockListItem } from '../../../@types/activities'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/unlockListService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
const unlockListService = new UnlockListService(null, null, null) as jest.Mocked<UnlockListService>

describe('Unlock list routes - planned events', () => {
  const handler = new PlannedEventRoutes(activitiesService, unlockListService)
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
    it('should render the expected view', async () => {
      req = {
        query: {
          datePresetOption: 'today',
          date: '2022-01-01',
          slot: 'am',
          location: 'Houseblock 1',
        },
      } as unknown as Request

      const expectedUnlockList: UnlockListItem[] = []
      unlockListService.getUnlockListForLocationGroups.mockResolvedValue(expectedUnlockList)

      await handler.GET(req, res)

      expect(unlockListService.getUnlockListForLocationGroups).toHaveBeenCalledWith(
        ['Houseblock 1'],
        req.query.date,
        req.query.slot,
        res.locals.user,
      )

      expect(res.render).toHaveBeenCalledWith('pages/unlock-list/planned-events', {
        unlockListItems: expectedUnlockList,
        plannedDate: 'Saturday 1st January 2022',
        plannedSlot: 'am',
      })
    })
  })
})
