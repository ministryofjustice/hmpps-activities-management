import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import ActivitiesRoutes from './activities'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityCategory, ScheduledActivity } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

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
          activity: { summary: 'Maths level 1', category: { code: 'SAA_EDUCATION' }, inCell: true },
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
          activity: { summary: 'Packing', category: { code: 'SAA_INDUSTRIES' }, inCell: false },
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

    const mockCategories = [
      {
        id: 1,
        code: 'SAA_EDUCATION',
        name: 'Eduction',
        description: 'Eduction',
      },
      {
        id: 2,
        code: 'SAA_INDUSTRIES',
        name: 'Packing',
        description: 'Packing',
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

      req = {
        query: { date: dateString },
        session: {
          activitiesFilters: {
            searchTerm: '',
            categories: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
            sessionFilters: [
              { value: 'AM', text: 'Morning (AM)', checked: true },
              { value: 'PM', text: 'Afternoon (PM)', checked: true },
              { value: 'ED', text: 'Evening (ED)', checked: true },
            ],
            categoryFilters: [
              { value: 'SAA_EDUCATION', text: 'Education', checked: true },
              { value: 'SAA_INDUSTRIES', text: 'Industries', checked: true },
            ],
            locationFilters: [
              { value: 'IN_CELL', text: 'In cell', checked: true },
              { value: 'OUT_OF_CELL', text: 'Out of cell', checked: true },
            ],
          },
        },
      } as unknown as Request

      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      when(activitiesService.getActivityCategories).calledWith(res.locals.user).mockResolvedValue(mockCategories)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
        activities: {
          am: [
            {
              allocated: 3,
              attended: 1,
              attendedPercentage: '33',
              category: 'SAA_EDUCATION',
              id: 1,
              location: 'Classroom',
              name: 'Maths level 1',
              scheduleName: 'Houseblock 1',
              notAttended: 1,
              notAttendedPercentage: '33',
              notRecorded: 1,
              notRecordedPercentage: '33',
              time: '10:00 - 11:00',
              timeSlot: 'am',
              cancelled: false,
              inCell: true,
            },
          ],
          pm: [
            {
              allocated: 3,
              attended: 1,
              attendedPercentage: '33',
              category: 'SAA_INDUSTRIES',
              id: 2,
              location: 'Classroom 2',
              name: 'Packing',
              scheduleName: 'Houseblock 2',
              notAttended: 1,
              notAttendedPercentage: '33',
              notRecorded: 1,
              notRecordedPercentage: '33',
              time: '13:00 - 14:00',
              timeSlot: 'pm',
              cancelled: false,
              inCell: false,
            },
          ],
          length: 2,
        },
        activitiesFilters: {
          categories: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
          categoryFilters: [
            { value: 'SAA_EDUCATION', text: 'Education', checked: true },
            { value: 'SAA_INDUSTRIES', text: 'Industries', checked: true },
          ],
          searchTerm: '',
          sessionFilters: [
            { value: 'AM', text: 'Morning (AM)', checked: true },
            { value: 'PM', text: 'Afternoon (PM)', checked: true },
            { value: 'ED', text: 'Evening (ED)', checked: true },
          ],
          locationFilters: [
            { value: 'IN_CELL', text: 'In cell', checked: true },
            { value: 'OUT_OF_CELL', text: 'Out of cell', checked: true },
          ],
        },
        activityDate: date,
      })
    })

    it('should filter the activities based on the search term', async () => {
      const dateString = '2022-12-08'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      when(activitiesService.getActivityCategories).calledWith(res.locals.user).mockResolvedValue(mockCategories)

      req = {
        query: { date: dateString },
        session: {
          activitiesFilters: {
            searchTerm: 'math',
            categories: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
            sessionFilters: [
              { value: 'AM', text: 'Morning (AM)', checked: true },
              { value: 'PM', text: 'Afternoon (PM)', checked: true },
              { value: 'ED', text: 'Evening (ED)', checked: true },
            ],
            categoryFilters: [
              { value: 'SAA_EDUCATION', text: 'Education', checked: true },
              { value: 'SAA_INDUSTRIES', text: 'Industries', checked: true },
            ],
            locationFilters: [
              { value: 'IN_CELL', text: 'In cell', checked: true },
              { value: 'OUT_OF_CELL', text: 'Out of cell', checked: true },
            ],
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
        activities: {
          am: [
            {
              allocated: 3,
              attended: 1,
              attendedPercentage: '33',
              category: 'SAA_EDUCATION',
              id: 1,
              location: 'Classroom',
              name: 'Maths level 1',
              scheduleName: 'Houseblock 1',
              notAttended: 1,
              notAttendedPercentage: '33',
              notRecorded: 1,
              notRecordedPercentage: '33',
              time: '10:00 - 11:00',
              timeSlot: 'am',
              cancelled: false,
              inCell: true,
            },
          ],
          length: 1,
        },
        activitiesFilters: {
          categories: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
          categoryFilters: [
            { value: 'SAA_EDUCATION', text: 'Education', checked: true },
            { value: 'SAA_INDUSTRIES', text: 'Industries', checked: true },
          ],
          searchTerm: 'math',
          sessionFilters: [
            { value: 'AM', text: 'Morning (AM)', checked: true },
            { value: 'PM', text: 'Afternoon (PM)', checked: true },
            { value: 'ED', text: 'Evening (ED)', checked: true },
          ],
          locationFilters: [
            { value: 'IN_CELL', text: 'In cell', checked: true },
            { value: 'OUT_OF_CELL', text: 'Out of cell', checked: true },
          ],
        },
        activityDate: date,
      })
    })

    it('should filter the activities based on the time slot', async () => {
      const dateString = '2022-12-08'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      when(activitiesService.getActivityCategories).calledWith(res.locals.user).mockResolvedValue(mockCategories)

      req = {
        query: { date: dateString },
        session: {
          activitiesFilters: {
            searchTerm: '',
            categories: ['SAA_EDUCATION'],
            sessionFilters: [
              { value: 'AM', text: 'Morning (AM)', checked: true },
              { value: 'PM', text: 'Afternoon (PM)', checked: false },
              { value: 'ED', text: 'Evening (ED)', checked: false },
            ],
            categoryFilters: [{ value: 'SAA_EDUCATION', text: 'Education', checked: true }],
            locationFilters: [
              { value: 'IN_CELL', text: 'In cell', checked: true },
              { value: 'OUT_OF_CELL', text: 'Out of cell', checked: true },
            ],
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
        activities: {
          am: [
            {
              allocated: 3,
              attended: 1,
              attendedPercentage: '33',
              cancelled: false,
              category: 'SAA_EDUCATION',
              id: 1,
              location: 'Classroom',
              name: 'Maths level 1',
              scheduleName: 'Houseblock 1',
              notAttended: 1,
              notAttendedPercentage: '33',
              notRecorded: 1,
              notRecordedPercentage: '33',
              time: '10:00 - 11:00',
              timeSlot: 'am',
              inCell: true,
            },
          ],
          length: 1,
        },
        activitiesFilters: {
          categories: ['SAA_EDUCATION'],
          categoryFilters: [{ value: 'SAA_EDUCATION', text: 'Education', checked: true }],
          searchTerm: '',
          sessionFilters: [
            { value: 'AM', text: 'Morning (AM)', checked: true },
            { value: 'PM', text: 'Afternoon (PM)', checked: false },
            { value: 'ED', text: 'Evening (ED)', checked: false },
          ],
          locationFilters: [
            { value: 'IN_CELL', text: 'In cell', checked: true },
            { value: 'OUT_OF_CELL', text: 'Out of cell', checked: true },
          ],
        },
        activityDate: date,
      })
    })

    it('should filter the activities based on the category', async () => {
      const dateString = '2022-12-08'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      when(activitiesService.getActivityCategories).calledWith(res.locals.user).mockResolvedValue(mockCategories)

      req = {
        query: { date: dateString },
        session: {
          activitiesFilters: {
            searchTerm: '',
            categories: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
            sessionFilters: [
              { value: 'AM', text: 'Morning (AM)', checked: true },
              { value: 'PM', text: 'Afternoon (PM)', checked: true },
              { value: 'ED', text: 'Evening (ED)', checked: true },
            ],
            categoryFilters: [
              { value: 'SAA_EDUCATION', text: 'Education', checked: false },
              { value: 'SAA_INDUSTRIES', text: 'Industries', checked: true },
            ],
            locationFilters: [
              { value: 'IN_CELL', text: 'In cell', checked: true },
              { value: 'OUT_OF_CELL', text: 'Out of cell', checked: true },
            ],
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
        activities: {
          pm: [
            {
              allocated: 3,
              attended: 1,
              attendedPercentage: '33',
              cancelled: false,
              category: 'SAA_INDUSTRIES',
              id: 2,
              location: 'Classroom 2',
              name: 'Packing',
              scheduleName: 'Houseblock 2',
              notAttended: 1,
              notAttendedPercentage: '33',
              notRecorded: 1,
              notRecordedPercentage: '33',
              time: '13:00 - 14:00',
              timeSlot: 'pm',
              inCell: false,
            },
          ],
          length: 1,
        },
        activitiesFilters: {
          categories: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
          categoryFilters: [
            { value: 'SAA_EDUCATION', text: 'Education', checked: false },
            { value: 'SAA_INDUSTRIES', text: 'Industries', checked: true },
          ],
          searchTerm: '',
          sessionFilters: [
            { value: 'AM', text: 'Morning (AM)', checked: true },
            { value: 'PM', text: 'Afternoon (PM)', checked: true },
            { value: 'ED', text: 'Evening (ED)', checked: true },
          ],
          locationFilters: [
            { value: 'IN_CELL', text: 'In cell', checked: true },
            { value: 'OUT_OF_CELL', text: 'Out of cell', checked: true },
          ],
        },
        activityDate: date,
      })
    })

    it('should filter the activities based on the location', async () => {
      const dateString = '2022-12-08'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, res.locals.user)
        .mockResolvedValue(mockApiResponse)

      when(activitiesService.getActivityCategories).calledWith(res.locals.user).mockResolvedValue(mockCategories)

      req = {
        query: { date: dateString },
        session: {
          activitiesFilters: {
            searchTerm: '',
            categories: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
            sessionFilters: [
              { value: 'AM', text: 'Morning (AM)', checked: true },
              { value: 'PM', text: 'Afternoon (PM)', checked: true },
              { value: 'ED', text: 'Evening (ED)', checked: true },
            ],
            categoryFilters: [
              { value: 'SAA_EDUCATION', text: 'Education', checked: true },
              { value: 'SAA_INDUSTRIES', text: 'Industries', checked: true },
            ],
            locationFilters: [
              { value: 'IN_CELL', text: 'In cell', checked: true },
              { value: 'OUT_OF_CELL', text: 'Out of cell', checked: false },
            ],
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
        activities: {
          am: [
            {
              allocated: 3,
              attended: 1,
              attendedPercentage: '33',
              cancelled: false,
              category: 'SAA_EDUCATION',
              id: 1,
              location: 'Classroom',
              name: 'Maths level 1',
              scheduleName: 'Houseblock 1',
              notAttended: 1,
              notAttendedPercentage: '33',
              notRecorded: 1,
              notRecordedPercentage: '33',
              time: '10:00 - 11:00',
              timeSlot: 'am',
              inCell: true,
            },
          ],
          length: 1,
        },
        activitiesFilters: {
          categories: ['SAA_EDUCATION', 'SAA_INDUSTRIES'],
          categoryFilters: [
            { value: 'SAA_EDUCATION', text: 'Education', checked: true },
            { value: 'SAA_INDUSTRIES', text: 'Industries', checked: true },
          ],
          searchTerm: '',
          sessionFilters: [
            { value: 'AM', text: 'Morning (AM)', checked: true },
            { value: 'PM', text: 'Afternoon (PM)', checked: true },
            { value: 'ED', text: 'Evening (ED)', checked: true },
          ],
          locationFilters: [
            { value: 'IN_CELL', text: 'In cell', checked: true },
            { value: 'OUT_OF_CELL', text: 'Out of cell', checked: false },
          ],
        },
        activityDate: date,
      })
    })
  })
})
