import { getMockReq, getMockRes } from '@jest-mock/express'
import ActivityListRouteHandler from './ActivityListRouteHandler'
import activityList from '../../../middleware/fixtures/activity_list_1.json'

describe('activityListRouteHandler', () => {
  let controller: ActivityListRouteHandler

  beforeEach(() => {
    controller = new ActivityListRouteHandler()
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
          activityList,
          user: { token: 'token' },
        },
      })

      await controller.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activityList/index', {
        rowData: [
          {
            name: 'Colt, Barnett',
            location: 'MDI-2-1-035',
            prisonNumber: 'G3577UD',
            relevantAlerts: [],
            activity: '15:00 -  Res1 Elderly Tues 15.00 Wed /Fri 10.00',
            otherActivities: '13:15 - 16:15 - PICTA PM',
          },
          {
            name: 'Moragne, Berke',
            location: 'MDI-2-3-008',
            prisonNumber: 'G5824GU',
            relevantAlerts: [],
            activity: '15:00 -  Res1 Elderly Tues 15.00 Wed /Fri 10.00',
            otherActivities: '13:15 - 16:15 - ED1-Rm1 L1/Num PM',
          },
          {
            name: 'Raygoza, Bard',
            location: 'MDI-2-1-031',
            prisonNumber: 'G9318UI',
            relevantAlerts: ['PEEP'],
            activity: '15:00 -  Res1 Elderly Tues 15.00 Wed /Fri 10.00',
            otherActivities: '13:15 - 16:15 - Tailors PM',
          },
        ],
      })
    })
  })
})
