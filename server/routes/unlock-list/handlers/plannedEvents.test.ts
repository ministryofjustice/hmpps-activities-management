import { Request, Response } from 'express'
import PlannedEventRoutes from './plannedEvents'
import ActivitiesService from '../../../services/activitiesService'

jest.mock('../../../services/activitiesService')
const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Unlock list routes - planned events', () => {
  const handler = new PlannedEventRoutes(activitiesService)
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
          locations: 'Houseblock 1,Houseblock 2',
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/unlock-list/planned-events', {
        plannedDatePresetOption: 'today',
        plannedDate: '2022-01-01',
        plannedSlot: 'am',
        plannedLocations: ['Houseblock 1', 'Houseblock 2'],
      })
    })
  })
})
