import { Request, Response } from 'express'

import ActivitiesService from '../../../services/activitiesService'
import ActivityRoutes from './activity'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - View Activity', () => {
  const handler = new ActivityRoutes(activitiesService)
  let req: Request
  let res: Response

  activitiesService.getActivity.mockResolvedValue({
    attendanceRequired: false,
    category: { code: 'EDUCATION', id: 1, name: 'Education' },
    createdBy: '',
    createdTime: '',
    description: '',
    eligibilityRules: [],
    endDate: '',
    inCell: false,
    minimumIncentiveLevel: '',
    outsideWork: false,
    pay: [],
    payPerSession: '',
    pieceWork: false,
    prisonCode: '',
    riskLevel: '',
    schedules: [],
    startDate: '',
    summary: 'Maths Level 1',
    tier: { code: '', description: '', id: 0 },
    waitingList: [],
    id: 1,
  })

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        id: '1',
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page with view activity', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/manage-schedules/view-activity', {
        activity: {
          attendanceRequired: false,
          category: { code: 'EDUCATION', id: 1, name: 'Education' },
          createdBy: '',
          createdTime: '',
          description: '',
          eligibilityRules: [],
          endDate: '',
          inCell: false,
          minimumIncentiveLevel: '',
          outsideWork: false,
          pay: [],
          payPerSession: '',
          pieceWork: false,
          prisonCode: '',
          riskLevel: '',
          schedules: [],
          startDate: '',
          summary: 'Maths Level 1',
          tier: { code: '', description: '', id: 0 },
          waitingList: [],
          id: 1,
        },
      })
    })
  })
})
