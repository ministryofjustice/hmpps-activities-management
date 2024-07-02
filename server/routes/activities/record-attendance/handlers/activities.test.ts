import { Request, Response } from 'express'
import { when } from 'jest-when'
import { addDays, format, parse } from 'date-fns'
import ActivitiesRoutes from './activities'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { ActivityCategory } from '../../../../@types/activitiesAPI/types'
import attendanceSummaryResponse from '../../../../services/fixtures/attendance_summary_1.json'
import { AttendActivityMode } from '../recordAttendanceRequests'
import { LocationType } from '../../create-an-activity/handlers/location'
import config from '../../../../config'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Activities', () => {
  const handler = new ActivitiesRoutes(activitiesService, prisonService)

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

  // TODO: SAA-1796 Remove tests
  describe('GET (Legacy)', () => {
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
      config.recordAttendanceSelectSlotFirst = false

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
          ed: [attendanceSummaryResponse[3]],
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
        selectedSessions: ['pm', 'ed'],
        activityRows: [
          {
            ...attendanceSummaryResponse[0],
            session: 'pm',
            sessionOrderIndex: 1,
          },
          {
            ...attendanceSummaryResponse[2],
            session: 'pm',
            sessionOrderIndex: 1,
          },
          {
            ...attendanceSummaryResponse[3],
            session: 'ed',
            sessionOrderIndex: 2,
          },
        ],
      })
    })

    it('should render with the expected view when multiple sessions are returned', async () => {
      req = {
        query: {
          date: dateString,
          sessionFilters: 'am,pm',
          categoryFilters: 'SAA_EDUCATION,SAA_INDUSTRIES',
          locationFilters: 'IN_CELL,OUT_OF_CELL',
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
        activitiesBySession: {
          am: [attendanceSummaryResponse[1]],
          pm: [attendanceSummaryResponse[0], attendanceSummaryResponse[2]],
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
            { value: 'ed', text: 'Evening (ED)', checked: false },
          ],
          locationFilters: [
            { value: 'IN_CELL', text: 'In cell', checked: true },
            { value: 'OUT_OF_CELL', text: 'Out of cell', checked: true },
          ],
        },
        activityDate: date,
        selectedSessions: ['am', 'pm'],
        activityRows: [
          {
            ...attendanceSummaryResponse[1],
            session: 'am',
            sessionOrderIndex: 0,
          },
          {
            ...attendanceSummaryResponse[0],
            session: 'pm',
            sessionOrderIndex: 1,
          },
          {
            ...attendanceSummaryResponse[2],
            session: 'pm',
            sessionOrderIndex: 1,
          },
        ],
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
        selectedSessions: null,
        activityRows: [
          {
            ...attendanceSummaryResponse[2],
            session: 'pm',
            sessionOrderIndex: 1,
          },
        ],
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
        selectedSessions: ['am'],
        activityRows: [
          {
            ...attendanceSummaryResponse[1],
            session: 'am',
            sessionOrderIndex: 0,
          },
        ],
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
          ed: [attendanceSummaryResponse[3]],
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
        selectedSessions: null,
        activityRows: [
          {
            ...attendanceSummaryResponse[0],
            session: 'pm',
            sessionOrderIndex: 1,
          },
          {
            ...attendanceSummaryResponse[2],
            session: 'pm',
            sessionOrderIndex: 1,
          },
          {
            ...attendanceSummaryResponse[3],
            session: 'ed',
            sessionOrderIndex: 2,
          },
        ],
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
        selectedSessions: null,
        activityRows: [
          {
            ...attendanceSummaryResponse[0],
            session: 'pm',
            sessionOrderIndex: 1,
          },
        ],
      })
    })
  })

  // TODO: SAA-1795 - Keep these tests but rename
  describe('GET (New)', () => {
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
      config.recordAttendanceSelectSlotFirst = true

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
          locationType: LocationType.IN_CELL,
          locationId: 100,
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
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
          locationType: LocationType.IN_CELL,
          locationId: null,
        },
        activityDate: date,
        selectedSessions: ['pm', 'ed'],
        activityRows: [
          {
            ...attendanceSummaryResponse[0],
            session: 'pm',
            sessionOrderIndex: 1,
          },
        ],
        locations: [],
      })
    })

    it('should render with the expected view when multiple sessions are returned', async () => {
      req = {
        query: {
          date: dateString,
          sessionFilters: 'am,pm',
          categoryFilters: 'SAA_EDUCATION,SAA_INDUSTRIES',
          // locationFilters: 'IN_CELL,OUT_OF_CELL',
          // locationType: null,
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
        filterItems: {
          categoryFilters: [
            { value: 'SAA_EDUCATION', text: 'Education', checked: true },
            { value: 'SAA_INDUSTRIES', text: 'Packing', checked: true },
          ],
          sessionFilters: [
            { value: 'am', text: 'Morning (AM)', checked: true },
            { value: 'pm', text: 'Afternoon (PM)', checked: true },
            { value: 'ed', text: 'Evening (ED)', checked: false },
          ],
          locationType: 'ALL',
          locationId: null,
        },
        activityDate: date,
        selectedSessions: ['am', 'pm'],
        activityRows: [
          {
            ...attendanceSummaryResponse[1],
            session: 'am',
            sessionOrderIndex: 0,
          },
          {
            ...attendanceSummaryResponse[0],
            session: 'pm',
            sessionOrderIndex: 1,
          },
          {
            ...attendanceSummaryResponse[2],
            session: 'pm',
            sessionOrderIndex: 1,
          },
        ],
        locations: [],
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
          locationId: null,
          locationType: 'ALL',
        },
        activityDate: date,
        selectedSessions: null,
        activityRows: [
          {
            ...attendanceSummaryResponse[2],
            session: 'pm',
            sessionOrderIndex: 1,
          },
        ],
        locations: [],
      })
    })

    it('should filter the activities based on the time slot', async () => {
      req = {
        query: { date: dateString, sessionFilters: 'am' },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
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
          locationId: null,
          locationType: 'ALL',
        },
        activityDate: date,
        selectedSessions: ['am'],
        activityRows: [
          {
            ...attendanceSummaryResponse[1],
            session: 'am',
            sessionOrderIndex: 0,
          },
        ],
        locations: [],
      })
    })

    it('should filter the activities based on the category', async () => {
      req = {
        query: { date: dateString, categoryFilters: 'SAA_EDUCATION' },
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
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
          locationId: null,
          locationType: 'ALL',
        },
        activityDate: date,
        selectedSessions: null,
        activityRows: [
          {
            ...attendanceSummaryResponse[0],
            session: 'pm',
            sessionOrderIndex: 1,
          },
          {
            ...attendanceSummaryResponse[2],
            session: 'pm',
            sessionOrderIndex: 1,
          },
          {
            ...attendanceSummaryResponse[3],
            session: 'ed',
            sessionOrderIndex: 2,
          },
        ],
        locations: [],
      })
    })

    describe('Filter by location', () => {
      it('should filter IN_CELL activities', async () => {
        req = {
          query: {
            date: dateString,
            locationType: 'IN_CELL',
          },
        } as unknown as Request

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
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
            locationId: null,
            locationType: 'IN_CELL',
          },
          activityDate: date,
          selectedSessions: null,
          activityRows: [
            {
              ...attendanceSummaryResponse[0],
              session: 'pm',
              sessionOrderIndex: 1,
            },
          ],
          locations: [],
        })
      })

      it('should filter ON_WING activities', async () => {
        req = {
          query: {
            date: dateString,
            locationType: 'ON_WING',
          },
        } as unknown as Request

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
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
            locationId: null,
            locationType: 'ON_WING',
          },
          activityDate: date,
          selectedSessions: null,
          activityRows: [
            {
              ...attendanceSummaryResponse[2],
              session: 'pm',
              sessionOrderIndex: 1,
            },
          ],
          locations: [],
        })
      })

      it('should filter OFF_WING activities', async () => {
        req = {
          query: {
            date: dateString,
            locationType: 'OFF_WING',
          },
        } as unknown as Request

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
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
            locationId: null,
            locationType: 'OFF_WING',
          },
          activityDate: date,
          selectedSessions: null,
          activityRows: [
            {
              ...attendanceSummaryResponse[3],
              session: 'ed',
              sessionOrderIndex: 2,
            },
          ],
          locations: [],
        })
      })

      it('should filter OUT_OF_CELL activities', async () => {
        req = {
          query: {
            date: dateString,
            locationType: 'OUT_OF_CELL',
            locationId: 100,
          },
        } as unknown as Request

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/activities', {
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
            locationId: '100',
            locationType: 'OUT_OF_CELL',
          },
          activityDate: date,
          selectedSessions: null,
          activityRows: [
            {
              ...attendanceSummaryResponse[1],
              session: 'am',
              sessionOrderIndex: 0,
            },
          ],
          locations: [],
        })
      })
    })
  })

  describe('POST_ATTENDANCES', () => {
    it('should save the selected instance ids and redirect', async () => {
      req = {
        body: {
          selectedInstanceIds: [345, 567],
        },
        session: {},
      } as unknown as Request

      await handler.POST_ATTENDANCES(req, res)

      expect(req.session.recordAttendanceRequests).toEqual({
        mode: AttendActivityMode.MULTIPLE,
        selectedInstanceIds: [345, 567],
      })

      expect(res.redirect).toHaveBeenCalledWith('/activities/attendance/activities/attendance-list')
    })
  })
})
