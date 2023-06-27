import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { ScheduledActivity } from '../../../../@types/activitiesAPI/types'
import CancelledSessionsRoutes from './cancelledSessions'
import { formatDate } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

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
    } as unknown as Request
  })

  describe('GET', () => {
    const mockApiResponse = [
      {
        id: 1,
        startTime: '10:00',
        endTime: '11:00',
        activitySchedule: {
          activity: { summary: 'Maths level 1', category: { code: 'SAA_EDUCATION' }, inCell: true, allocated: 4 },
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
        activitySchedule: {
          activity: { summary: 'Packing', category: { code: 'SAA_INDUSTRIES' }, inCell: false, allocated: 4 },
          description: 'Houseblock 2',
          internalLocation: { description: 'Classroom 2' },
        },
        cancelled: false,
        allocated: 4,
        comment: 'Stuff Training',
        cancelledReason: 'Teacher unavailable',
        attendances: [],
      },
      {
        id: 3,
        startTime: '13:00',
        endTime: '14:00',
        activitySchedule: {
          activity: { summary: 'Packing', category: { code: 'SAA_INDUSTRIES' }, inCell: false, allocated: 4 },
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
          attendanceSummaryFilters: {
            searchTerm: '',
          },
        },
      } as unknown as Request

      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/daily-attendance-summary/cancelled-sessions', {
        activityDate: date,
        cancelledSessions: [
          {
            id: 1,
            summary: 'Maths level 1',
            location: 'Classroom',
            timeSlot: 'AM',
            reason: 'Teacher unavailable',
            allocated: 4,
            comment: 'Stuff training',
          },
          {
            id: 3,
            summary: 'Packing',
            location: 'Classroom 2',
            timeSlot: 'PM',
            reason: 'Teacher unavailable',
            allocated: 4,
            comment: 'Stuff training',
          },
        ],
        attendanceSummaryFilters: {
          searchTerm: '',
        },
      })
    })

    it('should filter cancelled sessions based on the search term', async () => {
      const dateString = '2022-12-08'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      req = {
        query: { date: dateString },
        session: {
          attendanceSummaryFilters: {
            searchTerm: 'math',
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/daily-attendance-summary/cancelled-sessions', {
        activityDate: date,
        cancelledSessions: [
          {
            id: 1,
            summary: 'Maths level 1',
            location: 'Classroom',
            timeSlot: 'AM',
            reason: 'Teacher unavailable',
            allocated: 4,
            comment: 'Stuff training',
          },
        ],
        attendanceSummaryFilters: {
          searchTerm: 'math',
        },
      })
    })

    describe('POST', () => {
      it('should persist search term into session object', async () => {
        req = {
          query: {
            date: '2022-10-10',
          },
          body: {
            searchTerm: 'math',
          },
          session: {
            attendanceSummaryFilters: {
              activityDate: '2022-10-10',
            },
          },
        } as unknown as Request

        await handler.POST(req, res)

        const { attendanceSummaryFilters } = req.session

        // Different from default filter values
        expect(attendanceSummaryFilters.searchTerm).toEqual('math')

        expect(res.redirect).toHaveBeenCalledWith(
          `cancelled-sessions?date=${formatDate(attendanceSummaryFilters.activityDate, 'yyyy-MM-dd')}`,
        )
      })
    })
  })
})
