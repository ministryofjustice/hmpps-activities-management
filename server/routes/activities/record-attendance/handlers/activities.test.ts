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
      req = {
        session: {},
      } as unknown as Request

      when(activitiesService.getActivityCategories).calledWith(res.locals.user).mockResolvedValue(mockCategories)

      when(activitiesService.getScheduledInstanceAttendanceSummary)
        .calledWith(res.locals.user.activeCaseLoadId, date, res.locals.user)
        .mockResolvedValue(attendanceSummaryResponse)
    })

    it('should render with the expected view', async () => {
      req.query = {
        date: dateString,
        sessionFilters: 'pm,ed',
        categoryFilters: 'SAA_EDUCATION',
        locationType: LocationType.IN_CELL,
        locationId: '100',
      }

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
      req.query = {
        date: dateString,
        sessionFilters: 'am,pm',
        categoryFilters: 'SAA_EDUCATION,SAA_INDUSTRIES',
      }

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
      req.query = {
        date: format(addDays(new Date(), 61), 'yyyy-MM-dd'),
      }

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })

    it('should filter the activities based on the search term', async () => {
      req.query = {
        date: dateString,
        searchTerm: 'english',
      }

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
      req.query = { date: dateString, sessionFilters: 'am' }

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
      req.query = { date: dateString, categoryFilters: 'SAA_EDUCATION' }

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

    it('should clear any session data for record attendance', async () => {
      req = {
        query: {
          date: dateString,
          sessionFilters: 'am,pm',
          categoryFilters: 'SAA_EDUCATION,SAA_INDUSTRIES',
          locationFilters: 'IN_CELL,OUT_OF_CELL',
        },
        session: {
          recordAttendanceRequests: {
            mode: AttendActivityMode.MULTIPLE,
          },
        },
      } as unknown as Request

      await handler.GET(req, res)

      expect(req.session.recordAttendanceRequests).toEqual({})
    })

    describe('Filter by location', () => {
      it('should filter IN_CELL activities', async () => {
        req.query = {
          date: dateString,
          locationType: 'IN_CELL',
        }

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
        req.query = {
          date: dateString,
          locationType: 'ON_WING',
        }

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
        req.query = {
          date: dateString,
          locationType: 'OFF_WING',
        }

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
        req.query = {
          date: dateString,
          locationType: 'OUT_OF_CELL',
          locationId: '100',
        }

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
    it('should save the selected instance ids and redirect when multiple instances are chosen', async () => {
      req = {
        body: {
          selectedInstanceIds: [345, 567],
          activityDate: '2024-01-24',
          sessionFilters: ['am', 'ed'],
        },
        session: {},
      } as unknown as Request

      await handler.POST_ATTENDANCES(req, res)

      expect(req.session.recordAttendanceRequests).toEqual({
        mode: AttendActivityMode.MULTIPLE,
        selectedInstanceIds: [345, 567],
        activityDate: '2024-01-24',
        sessionFilters: ['am', 'ed'],
      })

      expect(res.redirect).toHaveBeenCalledWith('/activities/attendance/activities/attendance-list')
    })

    it('should save the selected instance ids and redirect when a single instance is chosen', async () => {
      req = {
        body: {
          selectedInstanceIds: [345],
        },
        session: {},
      } as unknown as Request

      await handler.POST_ATTENDANCES(req, res)

      expect(req.session.recordAttendanceRequests).toEqual({
        mode: AttendActivityMode.MULTIPLE,
        selectedInstanceIds: [345],
      })

      expect(res.redirect).toHaveBeenCalledWith('/activities/attendance/activities/345/attendance-list')
    })
  })
})
