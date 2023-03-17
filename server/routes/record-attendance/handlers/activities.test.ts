import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import ActivitiesRoutes from './activities'
import ActivitiesService from '../../../services/activitiesService'
import { ScheduledActivity } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Activities', () => {
  const handler = new ActivitiesRoutes(activitiesService)

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
    const mockApiResponse = [
      {
        id: 1,
        startTime: '10:00',
        endTime: '11:00',
        activitySchedule: {
          activity: { summary: 'Maths level 1' },
          description: 'Houseblock 1',
          internalLocation: { description: 'Classroom' },
        },
        cancelled: false,
        attendances: [
          { status: 'WAITING' },
          { status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
          { status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
        ],
      },
      {
        id: 2,
        startTime: '13:00',
        endTime: '14:00',
        activitySchedule: {
          activity: { summary: 'English level 1' },
          description: 'Houseblock 2',
          internalLocation: { description: 'Classroom 2' },
        },
        cancelled: false,
        attendances: [
          { status: 'WAITING' },
          { status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
          { status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
        ],
      },
    ] as ScheduledActivity[]

    it('should redirect to the select period page if date and slot are not provided', async () => {
      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })

    it('should redirect to the select period page if date is not provided', async () => {
      req.query.slot = 'am'
      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })

    it('should render with the expected view', async () => {
      const dateString = '2022-12-08'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      req.query = {
        date: dateString,
      }
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/activities', {
        activities: {
          am: [
            {
              allocated: 3,
              attended: 1,
              id: 1,
              location: 'Classroom',
              name: 'Maths level 1',
              scheduleName: 'Houseblock 1',
              notAttended: 1,
              notRecorded: 1,
              time: '10:00 - 11:00',
              timeSlot: 'am',
              cancelled: false,
            },
          ],
          pm: [
            {
              allocated: 3,
              attended: 1,
              id: 2,
              location: 'Classroom 2',
              name: 'English level 1',
              scheduleName: 'Houseblock 2',
              notAttended: 1,
              notRecorded: 1,
              time: '13:00 - 14:00',
              timeSlot: 'pm',
              cancelled: false,
            },
          ],
          length: 2,
        },
        date,
        searchString: undefined,
      })
    })

    it('should filter the activites based on the search term', async () => {
      const dateString = '2022-12-08'
      const searchTerm = 'math'

      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      req.query = {
        date: dateString,
        searchTerm,
      }
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/activities', {
        activities: {
          am: [
            {
              allocated: 3,
              attended: 1,
              id: 1,
              location: 'Classroom',
              name: 'Maths level 1',
              scheduleName: 'Houseblock 1',
              notAttended: 1,
              notRecorded: 1,
              time: '10:00 - 11:00',
              timeSlot: 'am',
              cancelled: false,
            },
          ],
          length: 1,
        },
        date,
        searchTerm: 'math',
      })
    })
  })
})
