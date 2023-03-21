import { Request, Response } from 'express'
import { when } from 'jest-when'
import { addDays, parse, subDays } from 'date-fns'
import ActivitiesRoutes from './activities'
import ActivitiesService from '../../../services/activitiesService'
import { ActivityCategory, ScheduledActivity } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Activities', () => {
  const handler = new ActivitiesRoutes(activitiesService)

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
      session: {
        activitiesFilters: {
          sessionFilters: ['am'],
          categoryFilters: ['Maths'],
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    const mockApiResponse = [
      {
        id: 1,
        startTime: '10:00',
        endTime: '11:00',
        activitySchedule: {
          activity: { summary: 'Maths level 1', category: { code: 'Category Code' } },
          description: 'Houseblock 1',
          internalLocation: { description: 'Classroom' },
        },
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
          activity: { summary: 'English level 1', category: { code: 'Category Code' } },
          description: 'Houseblock 2',
          internalLocation: { description: 'Classroom 2' },
        },
        attendances: [
          { status: 'WAITING' },
          { status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
          { status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
        ],
      },
    ] as ScheduledActivity[]

    const mockCategories = [
      {
        id: 1,
        code: 'ALL',
        name: 'ALL',
        description: 'ALL',
      },
    ] as ActivityCategory[]

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
      const previousDay = subDays(new Date(date), 1)
      const nextDay = addDays(new Date(date), 1)

      req = {
        query: { date: dateString },
        session: {
          activitiesFilters: {
            searchTerm: '',
            categories: ['ALL'],
            sessionFilters: [
              { value: 'AM', text: 'Morning (AM)', checked: true },
              { value: 'PM', text: 'Afternoon (PM)', checked: true },
              { value: 'ED', text: 'Evening (ED)', checked: true },
            ],
            categoryFilters: [{ value: 'ALL', text: 'ALL', checked: true }],
          },
        },
      } as unknown as Request

      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      when(activitiesService.getActivityCategories).calledWith(res.locals.user).mockResolvedValue(mockCategories)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/activities', {
        activities: {
          am: [
            {
              allocated: 3,
              attended: 1,
              category: 'Category Code',
              id: 1,
              location: 'Classroom',
              name: 'Maths level 1',
              scheduleName: 'Houseblock 1',
              notAttended: 1,
              notRecorded: 1,
              time: '10:00 - 11:00',
              timeSlot: 'am',
            },
          ],
          pm: [
            {
              allocated: 3,
              attended: 1,
              category: 'Category Code',
              id: 2,
              location: 'Classroom 2',
              name: 'English level 1',
              scheduleName: 'Houseblock 2',
              notAttended: 1,
              notRecorded: 1,
              time: '13:00 - 14:00',
              timeSlot: 'pm',
            },
          ],
          length: 2,
        },
        activitiesFilters: {
          categories: ['ALL'],
          categoryFilters: [{ value: 'ALL', text: 'ALL', checked: true }],
          searchTerm: '',
          sessionFilters: [
            { value: 'AM', text: 'Morning (AM)', checked: true },
            { value: 'PM', text: 'Afternoon (PM)', checked: true },
            { value: 'ED', text: 'Evening (ED)', checked: true },
          ],
        },
        activityDate: date,
        previousDay,
        nextDay,
        searchTerm: '',
      })
    })

    it('should filter the activities based on the search term', async () => {
      const dateString = '2022-12-08'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())
      const previousDay = subDays(new Date(date), 1)
      const nextDay = addDays(new Date(date), 1)

      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      when(activitiesService.getActivityCategories).calledWith(res.locals.user).mockResolvedValue(mockCategories)

      req = {
        query: { date: dateString },
        session: {
          activitiesFilters: {
            searchTerm: 'math',
            categories: ['ALL'],
            sessionFilters: [
              { value: 'AM', text: 'Morning (AM)', checked: true },
              { value: 'PM', text: 'Afternoon (PM)', checked: true },
              { value: 'ED', text: 'Evening (ED)', checked: true },
            ],
            categoryFilters: [{ value: 'ALL', text: 'ALL', checked: true }],
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/activities', {
        activities: {
          am: [
            {
              allocated: 3,
              attended: 1,
              category: 'Category Code',
              id: 1,
              location: 'Classroom',
              name: 'Maths level 1',
              scheduleName: 'Houseblock 1',
              notAttended: 1,
              notRecorded: 1,
              time: '10:00 - 11:00',
              timeSlot: 'am',
            },
          ],
          length: 1,
        },
        activitiesFilters: {
          categories: ['ALL'],
          categoryFilters: [{ value: 'ALL', text: 'ALL', checked: true }],
          searchTerm: 'math',
          sessionFilters: [
            { value: 'AM', text: 'Morning (AM)', checked: true },
            { value: 'PM', text: 'Afternoon (PM)', checked: true },
            { value: 'ED', text: 'Evening (ED)', checked: true },
          ],
        },
        activityDate: date,
        previousDay,
        nextDay,
        searchTerm: 'math',
      })
    })
  })
})
