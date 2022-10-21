import { getMockReq, getMockRes } from '@jest-mock/express'
import activityScheduleAllocations from '../../../middleware/fixtures/activity_schedule_allocation_1.json'
import ActivityListRouteHandler from './ActivityListRouteHandler'

describe('activityListRouteHandler', () => {
  let controller: ActivityListRouteHandler

  beforeEach(() => {
    controller = new ActivityListRouteHandler()
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should render', async () => {
      const req = getMockReq({
        session: {
          data: {},
        },
      })
      const { res } = getMockRes({
        locals: {
          activityScheduleAllocations,
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })

      await controller.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activityListAm/index', {
        rowData: [
          {
            activity: 'Wednesday AM Houseblock 3',
            id: 3,
            location: 'MDI-3-3-006',
            name: 'Daniels, Jack',
            prisonNumber: 'G3439UH',
            relevantAlerts: ['ACCT'],
          },
        ],
      })
    })
  })
})
