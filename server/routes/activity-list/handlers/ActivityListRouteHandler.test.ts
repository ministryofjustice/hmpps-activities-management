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
          [
            { text: 'Beam, Jim', attributes: { 'data-sort-value': 'BEAM' } },
            { text: 'MDI-2-2-025' },
            { text: 'G9714UJ' },
          ],
          [
            { text: 'Daniels, Jack', attributes: { 'data-sort-value': 'DANIELS' } },
            { text: 'MDI-3-3-030' },
            { text: 'G2680UD' },
          ],
        ],
      })
    })
  })
})
