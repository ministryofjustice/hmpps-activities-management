import { Request, Response } from 'express'
import { when } from 'jest-when'
import { addDays, format, parse } from 'date-fns'
import ActivitiesRoutes from './activities'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityCategory } from '../../../../@types/activitiesAPI/types'
import attendanceSummaryResponse from '../../../../services/fixtures/attendance_summary_1.json'

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
          activeCaseLoadId: 'MDI',
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
    const dateString = '2022-12-08'
    const date = parse(dateString, 'yyyy-MM-dd', new Date())

    const mockCategories = [
      {
        id: 1,
        code: 'SAA_EDUCATION',
        name: 'Education',
        description: 'Education',
      },
      {
        id: 2,
        code: 'SAA_INDUSTRIES',
        name: 'Packing',
        description: 'Packing',
      },
    ] as ActivityCategory[]

    beforeEach(() => {
      when(activitiesService.getActivityCategories).calledWith(res.locals.user).mockResolvedValue(mockCategories)

      when(activitiesService.getScheduledInstanceAttendanceSummary)
        .calledWith(res.locals.user.activeCaseLoadId, date, res.locals.user)
        .mockResolvedValue(attendanceSummaryResponse)
    })

    it('should render with the expected view', async () => {
      req = {
        query: {
          date: dateString,
          sessionFilters: 'pm,ed',
          categoryFilters: 'SAA_EDUCATION',
          locationFilters: 'IN_CELL,OUT_OF_CELL',
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
        activitiesBySession: {
          am: [],
          pm: [attendanceSummaryResponse[0], attendanceSummaryResponse[2]],
          ed: [],
        },
        filterItems: {
          categoryFilters: [
            { value: 'SAA_EDUCATION', text: 'Education', checked: true },
            { value: 'SAA_INDUSTRIES', text: 'Packing', checked: false },
          ],
          sessionFilters: [
            { value: 'am', text: 'Morning (AM)', checked: false },
            { value: 'pm', text: 'Afternoon (PM)', checked: true },
            { value: 'ed', text: 'Evening (ED)', checked: true },
          ],
          locationFilters: [
            { value: 'IN_CELL', text: 'In cell', checked: true },
            { value: 'OUT_OF_CELL', text: 'Out of cell', checked: true },
          ],
        },
        activityDate: date,
      })
    })

    it('should redirect back to select date page if selected date is out of range', async () => {
      req = {
        query: {
          date: format(addDays(new Date(), 61), 'yyyy-MM-dd'),
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })

    it('should filter the activities based on the search term', async () => {
      req = {
        query: {
          date: dateString,
          searchTerm: 'english',
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
        activitiesBySession: {
          am: [],
          pm: [attendanceSummaryResponse[2]],
          ed: [],
        },
        filterItems: {
          categoryFilters: [
            { value: 'SAA_EDUCATION', text: 'Education', checked: true },
            { value: 'SAA_INDUSTRIES', text: 'Packing', checked: true },
          ],
          sessionFilters: [
            { value: 'am', text: 'Morning (AM)', checked: true },
            { value: 'pm', text: 'Afternoon (PM)', checked: true },
            { value: 'ed', text: 'Evening (ED)', checked: true },
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
      req = {
        query: { date: dateString, sessionFilters: 'am' },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
        activitiesBySession: {
          am: [attendanceSummaryResponse[1]],
          pm: [],
          ed: [],
        },
        filterItems: {
          categoryFilters: [
            { value: 'SAA_EDUCATION', text: 'Education', checked: true },
            { value: 'SAA_INDUSTRIES', text: 'Packing', checked: true },
          ],
          sessionFilters: [
            { value: 'am', text: 'Morning (AM)', checked: true },
            { value: 'pm', text: 'Afternoon (PM)', checked: false },
            { value: 'ed', text: 'Evening (ED)', checked: false },
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
      req = {
        query: { date: dateString, categoryFilters: 'SAA_EDUCATION' },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
        activitiesBySession: {
          am: [],
          pm: [attendanceSummaryResponse[0], attendanceSummaryResponse[2]],
          ed: [],
        },
        filterItems: {
          categoryFilters: [
            { value: 'SAA_EDUCATION', text: 'Education', checked: true },
            { value: 'SAA_INDUSTRIES', text: 'Packing', checked: false },
          ],
          sessionFilters: [
            { value: 'am', text: 'Morning (AM)', checked: true },
            { value: 'pm', text: 'Afternoon (PM)', checked: true },
            { value: 'ed', text: 'Evening (ED)', checked: true },
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
      req = {
        query: {
          date: dateString,
          locationFilters: 'IN_CELL',
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
        activitiesBySession: {
          am: [],
          pm: [attendanceSummaryResponse[0]],
          ed: [],
        },
        filterItems: {
          categoryFilters: [
            { value: 'SAA_EDUCATION', text: 'Education', checked: true },
            { value: 'SAA_INDUSTRIES', text: 'Packing', checked: true },
          ],
          sessionFilters: [
            { value: 'am', text: 'Morning (AM)', checked: true },
            { value: 'pm', text: 'Afternoon (PM)', checked: true },
            { value: 'ed', text: 'Evening (ED)', checked: true },
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
