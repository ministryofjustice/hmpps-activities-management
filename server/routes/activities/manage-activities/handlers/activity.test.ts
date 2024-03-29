import { Request, Response } from 'express'
import { when } from 'jest-when'

import { addDays } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import ActivityRoutes from './activity'
import PrisonService from '../../../../services/prisonService'
import atLeast from '../../../../../jest.setup'

import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'
import { toDateString } from '../../../../utils/utils'
import { eventTierDescriptions } from '../../../../enum/eventTiers'
import { organiserDescriptions } from '../../../../enum/eventOrganisers'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

const today = new Date()
const nextWeek = addDays(today, 7)

describe('Route Handlers - View Activity', () => {
  const handler = new ActivityRoutes(activitiesService, prisonService)
  let req: Request
  let res: Response

  const mockActivity = {
    attendanceRequired: false,
    category: { code: 'EDUCATION', id: 1, name: 'Education' },
    createdBy: '',
    createdTime: '',
    description: '',
    eligibilityRules: [],
    endDate: toDateString(nextWeek),
    inCell: false,
    outsideWork: false,
    pay: [],
    payPerSession: 'H',
    pieceWork: false,
    prisonCode: '',
    riskLevel: '',
    schedules: [activitySchedule],
    startDate: toDateString(today),
    summary: 'Maths Level 1',
    tier: { code: '', description: '', id: 1 },
    organiser: { id: 1 },
    waitingList: [],
    id: 1,
    minimumEducationLevel: [],
  } as unknown as Activity

  when(activitiesService.getActivity).calledWith(atLeast(1)).mockResolvedValueOnce(mockActivity)

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
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-activities/view-activity', {
        activity: {
          attendanceRequired: false,
          category: { code: 'EDUCATION', id: 1, name: 'Education' },
          createdBy: '',
          createdTime: '',
          description: '',
          eligibilityRules: [],
          inCell: false,
          outsideWork: false,
          pay: [],
          payPerSession: 'H',
          pieceWork: false,
          prisonCode: '',
          riskLevel: '',
          schedules: [activitySchedule],
          startDate: toDateString(today),
          endDate: toDateString(nextWeek),
          summary: 'Maths Level 1',
          tier: { code: '', description: '', id: 1 },
          organiser: { id: 1 },
          waitingList: [],
          id: 1,
          minimumEducationLevel: [],
        },
        incentiveLevelPays: [],
        schedule: activitySchedule,
        dailySlots: {
          '1': [
            {
              day: 'Monday',
              slots: ['am'],
            },
            {
              day: 'Tuesday',
              slots: ['am'],
            },
            {
              day: 'Wednesday',
              slots: ['am'],
            },
            {
              day: 'Thursday',
              slots: ['am'],
            },
            {
              day: 'Friday',
              slots: ['am'],
            },
            {
              day: 'Saturday',
              slots: ['am'],
            },
            {
              day: 'Sunday',
              slots: ['am'],
            },
          ],
        },
        currentWeek: 1,
        tier: eventTierDescriptions[1],
        organiser: organiserDescriptions[1],
      })
    })
  })
})
