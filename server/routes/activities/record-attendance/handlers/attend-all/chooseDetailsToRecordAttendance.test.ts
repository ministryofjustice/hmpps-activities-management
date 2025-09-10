import { Request, Response } from 'express'
import ChooseDetailsToRecordAttendanceRoutes from './chooseDetailsToRecordAttendance'
import ActivitiesService from '../../../../../services/activitiesService'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Choose details to record attendance', () => {
  const handler = new ChooseDetailsToRecordAttendanceRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/attend-all/choose-details-to-record-attendance',
        {},
      )
    })
  })
})
