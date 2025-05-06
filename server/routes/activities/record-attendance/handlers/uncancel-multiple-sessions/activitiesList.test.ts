import { Request, Response } from 'express'
import { when } from 'jest-when'
import { addDays, format, parse } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import { ActivityCategory } from '../../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../../enum/timeSlot'
import LocationType from '../../../../../enum/locationType'
import UncancelMultipleSessionsRoutes from './activitiesList'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

const attendanceSummaryResponse = [
  {
    scheduledInstanceId: 144,
    activityId: 1,
    activityScheduleId: 1,
    summary: 'Math 1',
    categoryId: 1,
    sessionDate: '2023-08-22',
    startTime: '13:00',
    endTime: '16:30',
    inCell: true,
    onWing: false,
    offWing: false,
    timeSlot: TimeSlot.PM,
    attendanceRequired: true,
    cancelled: true,
    attendanceSummary: {
      allocations: 1,
      attendees: 1,
      notRecorded: 0,
      attended: 1,
      absences: 0,
      paid: 1,
    },
  },
  {
    scheduledInstanceId: 189,
    activityId: 5,
    activityScheduleId: 5,
    summary: 'Packing',
    categoryId: 2,
    sessionDate: '2023-08-22',
    startTime: '09:00',
    endTime: '12:00',
    timeSlot: TimeSlot.AM,
    inCell: false,
    onWing: false,
    offWing: false,
    attendanceRequired: false,
    internalLocation: {
      id: 100,
      code: 'MDI-WORK-1',
      description: 'WORKSHOP 1',
    },
    cancelled: true,
    attendanceSummary: {
      allocations: 2,
      attendees: 2,
      notRecorded: 1,
      attended: 1,
      absences: 0,
      paid: 1,
    },
  },
  {
    scheduledInstanceId: 236,
    activityId: 10,
    activityScheduleId: 10,
    summary: 'English 2',
    categoryId: 1,
    sessionDate: '2023-08-22',
    startTime: '13:00',
    endTime: '16:30',
    timeSlot: TimeSlot.PM,
    inCell: false,
    onWing: true,
    offWing: false,
    attendanceRequired: true,
    cancelled: false,
    attendanceSummary: {
      allocations: 4,
      attendees: 4,
      notRecorded: 3,
      attended: 1,
      absences: 2,
      paid: 1,
    },
  },
  {
    scheduledInstanceId: 444,
    activityId: 11,
    activityScheduleId: 11,
    summary: 'Math 2',
    categoryId: 1,
    sessionDate: '2023-08-22',
    startTime: '18:00',
    endTime: '19:00',
    timeSlot: TimeSlot.ED,
    inCell: false,
    onWing: false,
    offWing: true,
    attendanceRequired: true,
    cancelled: true,
    attendanceSummary: {
      allocations: 5,
      attendees: 4,
      notRecorded: 3,
      attended: 1,
      absences: 2,
      paid: 1,
    },
  },
]

describe('Route Handlers - Uncancel Multiple Sessions', () => {
  const handler = new UncancelMultipleSessionsRoutes(activitiesService, prisonService)

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
        sessionFilters: 'PM,ED',
        categoryFilters: 'SAA_EDUCATION',
        locationType: LocationType.IN_CELL,
        locationId: '100',
      }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/uncancel-multiple-sessions/cancelled-activities',
        {
          filterItems: {
            categoryFilters: [
              { value: 'SAA_EDUCATION', text: 'Education', checked: true },
              { value: 'SAA_INDUSTRIES', text: 'Packing', checked: false },
            ],
            sessionFilters: [
              { value: 'AM', text: 'Morning (AM)', checked: false },
              { value: 'PM', text: 'Afternoon (PM)', checked: true },
              { value: 'ED', text: 'Evening (ED)', checked: true },
            ],
            locationType: LocationType.IN_CELL,
            locationId: null,
          },
          activityDate: date,
          selectedSessions: ['PM', 'ED'],
          activityRows: [
            {
              ...attendanceSummaryResponse[0],
              session: 'PM',
            },
          ],
          locations: [],
        },
      )
    })

    it('should render with the expected view when multiple sessions are returned', async () => {
      req.query = {
        date: dateString,
        sessionFilters: 'AM,PM',
        categoryFilters: 'SAA_EDUCATION,SAA_INDUSTRIES',
      }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/uncancel-multiple-sessions/cancelled-activities',
        {
          filterItems: {
            categoryFilters: [
              { value: 'SAA_EDUCATION', text: 'Education', checked: true },
              { value: 'SAA_INDUSTRIES', text: 'Packing', checked: true },
            ],
            sessionFilters: [
              { value: 'AM', text: 'Morning (AM)', checked: true },
              { value: 'PM', text: 'Afternoon (PM)', checked: true },
              { value: 'ED', text: 'Evening (ED)', checked: false },
            ],
            locationType: 'ALL',
            locationId: null,
          },
          activityDate: date,
          selectedSessions: ['AM', 'PM'],
          activityRows: [
            {
              ...attendanceSummaryResponse[1],
              session: 'AM',
            },
            {
              ...attendanceSummaryResponse[0],
              session: 'PM',
            },
          ],
          locations: [],
        },
      )
    })

    it('should redirect back to select date page if selected date is out of range', async () => {
      req.query = {
        date: format(addDays(new Date(), 61), 'yyyy-MM-dd'),
      }

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('../select-period')
    })

    it('should clear any session data for record attendance', async () => {
      req = {
        query: {
          date: dateString,
          sessionFilters: 'AM,PM',
          categoryFilters: 'SAA_EDUCATION,SAA_INDUSTRIES',
          locationType: LocationType.IN_CELL,
        },
        session: {},
      } as unknown as Request

      await handler.GET(req, res)

      expect(req.session.recordAttendanceJourney).toEqual({})
    })
  })

  describe('POST_UNCANCEL', () => {
    it('should save the selected instance ids and redirect when multiple sessions are chosen', async () => {
      req = {
        body: {
          selectedInstanceIds: [789, 567],
          activityDate: '2024-03-24',
          sessionFilters: ['AM', 'PM'],
        },
        session: {},
      } as unknown as Request

      await handler.POST_UNCANCEL(req, res)

      expect(req.session.recordAttendanceJourney).toEqual({
        selectedInstanceIds: [789, 567],
        activityDate: '2024-03-24',
        sessionFilters: ['AM', 'PM'],
      })

      expect(res.redirect).toHaveBeenCalledWith('confirm')
    })
  })
})
