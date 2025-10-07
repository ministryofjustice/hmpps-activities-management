import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import LocationsService, { LocationWithDescription } from '../../../../../services/locationsService'
import ListActivitiesRoutes from './listActivities'
import LocationType from '../../../../../enum/locationType'
import { ActivityCategory } from '../../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../../enum/timeSlot'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/locationsService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const locationsService = new LocationsService(null) as jest.Mocked<LocationsService>

const aWing: LocationWithDescription = {
  id: '11111111-1111-1111-1111-111111111111',
  prisonId: 'RSI',
  code: 'AWING',
  locationType: 'RESIDENTIAL_UNIT',
  localName: 'A Wing',
  description: 'A Wing',
} as LocationWithDescription

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
    cancelled: false,
    dpsLocationId: '100',
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
    cancelled: false,
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
    cancelled: true,
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
    cancelled: false,
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

describe('Route Handlers - Attend All - List Activities', () => {
  const handler = new ListActivitiesRoutes(activitiesService, locationsService)
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

    beforeEach(() => {
      req = {
        session: {},
        journeyData: {},
      } as unknown as Request

      when(locationsService.getLocationById).calledWith('100', res.locals.user).mockResolvedValue(aWing)

      when(activitiesService.getActivityCategories).calledWith(res.locals.user).mockResolvedValue(mockCategories)

      when(activitiesService.getScheduledInstanceAttendanceSummary)
        .calledWith(res.locals.user.activeCaseLoadId, date, res.locals.user)
        .mockResolvedValue(attendanceSummaryResponse)
    })

    it('should render with the expected view', async () => {
      req.query = {
        date: dateString,
        sessionFilters: 'PM,ED',
        locationType: LocationType.OUT_OF_CELL,
        locationId: '100',
      }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attend-all/list-activities', {
        selectedLocation: aWing,
        filterItems: {
          categoryFilters: [
            { value: 'SAA_EDUCATION', text: 'Education', checked: true },
            { value: 'SAA_INDUSTRIES', text: 'Packing', checked: true },
          ],
          sessionFilters: [
            { value: 'AM', text: 'Morning (AM)', checked: false },
            { value: 'PM', text: 'Afternoon (PM)', checked: true },
            { value: 'ED', text: 'Evening (ED)', checked: true },
          ],
          locationType: LocationType.OUT_OF_CELL,
          locationId: '100',
        },
        activityDate: date,
        selectedSessions: ['PM', 'ED'],
        activityRows: [
          {
            ...attendanceSummaryResponse[0],
            session: 'PM',
            allowSelection: true,
          },
        ],
        locations: [],
        hasCancelledSessions: false,
      })
    })
  })
})
