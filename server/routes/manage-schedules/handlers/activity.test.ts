import { Request, Response } from 'express'

import ActivitiesService from '../../../services/activitiesService'
import ActivityRoutes from './activity'
import PrisonService from '../../../services/prisonService'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/prisonService')

const activitiesService = new ActivitiesService(null, null, null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - View Activity', () => {
  const handler = new ActivityRoutes(activitiesService, prisonService)
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
    minimumIncentiveNomisCode: 'BAS',
    minimumIncentiveLevel: 'Basic',
    outsideWork: false,
    pay: [],
    payPerSession: 'H',
    pieceWork: false,
    prisonCode: '',
    riskLevel: '',
    schedules: [],
    startDate: '',
    summary: 'Maths Level 1',
    tier: { code: '', description: '', id: 0 },
    waitingList: [],
    id: 1,
    minimumEducationLevel: [],
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
          minimumIncentiveNomisCode: 'BAS',
          minimumIncentiveLevel: 'Basic',
          outsideWork: false,
          pay: [],
          payPerSession: 'H',
          pieceWork: false,
          prisonCode: '',
          riskLevel: '',
          schedules: [],
          startDate: '',
          summary: 'Maths Level 1',
          tier: { code: '', description: '', id: 0 },
          waitingList: [],
          id: 1,
          minimumEducationLevel: [],
        },
        incentiveLevelPays: [],
      })
    })
  })
})
