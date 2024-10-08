import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { ScheduledActivity } from '../../../../@types/activitiesAPI/types'
import CancelledSessionsRoutes from './cancelledSessions'
import TimeSlot from '../../../../enum/timeSlot'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Cancelled Sessions List', () => {
  const handler = new CancelledSessionsRoutes(activitiesService)

  let req: Request
  let res: Response

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
      query: {},
      session: { attendanceSummaryJourney: {} },
    } as unknown as Request
  })

  describe('GET', () => {
    const mockApiResponse = [
      {
        id: 1,
        startTime: '10:00',
        endTime: '11:00',
        timeSlot: TimeSlot.AM,
        activitySchedule: {
          activity: {
            summary: 'Maths level 1',
            category: { code: 'SAA_EDUCATION' },
            inCell: false,
            offWing: false,
            allocated: 4,
          },
          description: 'Houseblock 1',
          internalLocation: { description: 'Classroom' },
        },
        cancelled: true,
        allocated: 4,
        comment: 'Stuff training',
        cancelledReason: 'Teacher unavailable',
        attendances: [],
      },
      {
        id: 2,
        startTime: '13:00',
        endTime: '14:00',
        timeSlot: TimeSlot.PM,
        activitySchedule: {
          activity: {
            summary: 'Packing',
            category: { code: 'SAA_INDUSTRIES' },
            inCell: false,
            offWing: false,
            allocated: 4,
          },
          description: 'Houseblock 2',
          internalLocation: { description: 'Classroom 2' },
        },
        cancelled: true,
        comment: 'Stuff training',
        cancelledReason: 'Teacher unavailable',
        attendances: [],
      },
    ] as ScheduledActivity[]

    it('should redirect to the select period page if date is not provided', async () => {
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })

    it('should render with the expected cancelled-session view', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      req = {
        query: {
          date: dateString,
        },
        session: {
          attendanceSummaryJourney: {
            searchTerm: '',
          },
        },
      } as unknown as Request

      when(activitiesService.getCancelledScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/cancelled-sessions', {
        activityDate: date,
        cancelledSessions: [
          {
            id: 1,
            summary: 'Maths level 1',
            inCell: false,
            offWing: false,
            location: 'Classroom',
            timeSlot: 'AM',
            startTime: '10:00',
            endTime: '11:00',
            reason: 'Teacher unavailable',
            allocated: 4,
            comment: 'Stuff training',
          },
          {
            id: 2,
            summary: 'Packing',
            inCell: false,
            offWing: false,
            location: 'Classroom 2',
            timeSlot: 'PM',
            startTime: '13:00',
            endTime: '14:00',
            reason: 'Teacher unavailable',
            allocated: 4,
            comment: 'Stuff training',
          },
        ],
      })
    })

    it('should filter cancelled sessions based on the search term', async () => {
      const dateString = '2022-12-08'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getCancelledScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      req = {
        query: { date: dateString },
        session: {
          attendanceSummaryJourney: {
            searchTerm: 'math',
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/cancelled-sessions', {
        activityDate: date,
        cancelledSessions: [
          {
            id: 1,
            summary: 'Maths level 1',
            inCell: false,
            offWing: false,
            location: 'Classroom',
            timeSlot: 'AM',
            startTime: '10:00',
            endTime: '11:00',
            reason: 'Teacher unavailable',
            allocated: 4,
            comment: 'Stuff training',
          },
        ],
      })
    })
  })
})
