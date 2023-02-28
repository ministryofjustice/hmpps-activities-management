import { Request, Response } from 'express'
import { when } from 'jest-when'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../middleware/fixtures/activity_1.json'
import ConfirmationRoutes from './confirmation'
import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity schedule - Confirmation', () => {
  const handler = new ConfirmationRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
        activity: {
          id: 1,
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createScheduleJourney: {},
      },
      params: {
        id: '1',
        scheduleId: '5',
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected page', async () => {
      when(activitiesService.getActivity).calledWith(atLeast(1)).mockResolvedValueOnce(activity)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/manage-schedules/create-schedule/confirmation', {
        activity: { id: 1 },
        scheduleId: 5,
      })
      expect(req.session.createScheduleJourney).toBeNull()
    })
  })
})
