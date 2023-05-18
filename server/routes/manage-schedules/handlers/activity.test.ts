import { Request, Response } from 'express'
import { when } from 'jest-when'

import ActivitiesService from '../../../services/activitiesService'
import ActivityRoutes from './activity'
import PrisonService from '../../../services/prisonService'
import atLeast from '../../../../jest.setup'

import activitySchedule from '../../../services/fixtures/activity_schedule_1.json'
import { Activity, ActivityScheduleLite } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/prisonService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - View Activity', () => {
  const handler = new ActivityRoutes(activitiesService, prisonService)
  let req: Request
  let res: Response

  when(activitiesService.getActivity)
    .calledWith(atLeast(1))
    .mockResolvedValue({
      attendanceRequired: false,
      category: { code: 'EDUCATION', id: 1, name: 'Education' },
      createdBy: '',
      createdTime: '',
      description: '',
      eligibilityRules: [],
      endDate: '2022-12-31',
      inCell: false,
      minimumIncentiveNomisCode: 'BAS',
      minimumIncentiveLevel: 'Basic',
      outsideWork: false,
      pay: [],
      payPerSession: 'H',
      pieceWork: false,
      prisonCode: '',
      riskLevel: '',
      schedules: [activitySchedule],
      startDate: '2022-01-01',
      summary: 'Maths Level 1',
      tier: { code: '', description: '', id: 0 },
      waitingList: [],
      id: 1,
      minimumEducationLevel: [],
    } as unknown as Activity)

  when(activitiesService.getDefaultScheduleOfActivity).mockResolvedValue(
    activitySchedule as unknown as ActivityScheduleLite,
  )

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
        activityId: '1',
      },
      session: {},
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
          endDate: '2022-12-31',
          inCell: false,
          minimumIncentiveNomisCode: 'BAS',
          minimumIncentiveLevel: 'Basic',
          outsideWork: false,
          pay: [],
          payPerSession: 'H',
          pieceWork: false,
          prisonCode: '',
          riskLevel: '',
          schedules: [activitySchedule],
          startDate: '2022-01-01',
          summary: 'Maths Level 1',
          tier: { code: '', description: '', id: 0 },
          waitingList: [],
          id: 1,
          minimumEducationLevel: [],
        },
        incentiveLevelPays: [],
        schedule: {
          ...activitySchedule,
          dailySlots: [
            {
              day: 'Monday',
              slots: [
                {
                  id: 1,
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Tuesday',
              slots: [
                {
                  id: 1,
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Wednesday',
              slots: [
                {
                  id: 1,
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Thursday',
              slots: [
                {
                  id: 1,
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Friday',
              slots: [
                {
                  id: 1,
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Saturday',
              slots: [
                {
                  id: 1,
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Sunday',
              slots: [
                {
                  id: 1,
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
          ],
        },
        attendanceCount: 0,
        allocationCount: 3,
        week: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      })
    })
  })
})
