import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format, toDate } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import UserService from '../../../../../services/userService'
import PrisonService from '../../../../../services/prisonService'
import {
  LocationGroup,
  PrisonerScheduledEvents,
  ScheduledActivity,
  ScheduledAttendee,
} from '../../../../../@types/activitiesAPI/types'
import atLeast from '../../../../../../jest.setup'
import { PagePrisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import { ScheduledInstanceAttendance } from '../attendanceList'
import SelectPeopleByResidentialLocationRoutes from './selectPeopleByResidentialLocation'
import TimeSlot from '../../../../../enum/timeSlot'
import { asString } from '../../../../../utils/utils'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/userService')
jest.mock('../../../../../services/prisonService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)
const userService = new UserService(null)

const today = format(new Date(), 'yyyy-MM-dd')

const scheduledActivity1 = {
  id: 123456,
  date: today,
  startTime: '08:45',
  endTime: '11:45',
  timeSlot: 'AM',
  cancelled: false,
  comment: null,
  attendances: [{ id: 1001, prisonerNumber: 'ABC123', status: 'WAITING', scheduleInstanceId: 123456 }],
  advanceAttendances: [],
  activitySchedule: {
    id: 518,
    description: 'A Wing Cleaner 2',
    internalLocation: null,
    activity: {
      id: 539,
    },
    startDate: '2023-10-24',
    endDate: '2026-10-05',
  },
} as unknown as ScheduledActivity

const scheduledActivity2 = {
  id: 123457,
  date: today,
  startTime: '13:45',
  endTime: '16:45',
  timeSlot: 'PM',
  cancelled: false,
  comment: null,
  attendances: [
    {
      id: 1002,
      prisonerNumber: 'ABC321',
      status: 'COMPLETED',
      attendanceReason: { code: 'ATTENDED' },
      scheduleInstanceId: 123457,
    },
  ],
  advanceAttendances: [],
  activitySchedule: {
    id: 518,
    description: 'A Wing Cleaner 2',
    internalLocation: null,
    activity: {
      id: 539,
    },
    startDate: '2023-10-24',
    endDate: '2026-10-05',
  },
} as unknown as ScheduledActivity

const scheduledEvents = {
  activities: [],
  appointments: [],
  courtHearings: [],
  visits: [],
  adjudications: [],
} as PrisonerScheduledEvents

const updatedInstance1 = {
  ...scheduledActivity1,
  isAmendable: true,
  isInFuture: false,
}
const updatedInstance2 = {
  ...scheduledActivity2,
  isAmendable: true,
  isInFuture: false,
}

const mockLocations = [
  {
    name: 'A-Wing',
    key: 'A-Wing',
    children: [],
  },
  {
    name: 'B-Wing',
    key: 'B-Wing',
    children: [],
  },
  {
    name: 'C-Wing',
    key: 'C-Wing',
    children: [],
  },
]

const prisoners = {
  totalPages: 1,
  totalElements: 4,
  pages: 1,
  size: 4,
  first: true,
  numberOfElements: 4,
  content: [
    {
      prisonerNumber: 'ABC123',
      bookingId: '111111',
      firstName: 'One',
      lastName: 'Onester',
      dateOfBirth: '2002-10-01',
      status: 'ACTIVE IN',
      inOutStatus: 'IN',
      prisonId: 'MDI',
      prisonName: 'HMP Moorland',
      cellLocation: '1-1-001',
      category: 'A',
      legalStatus: 'SENTENCED',
    },
    {
      prisonerNumber: 'ABC321',
      bookingId: '222222',
      firstName: 'Two',
      lastName: 'Twoster',
      dateOfBirth: '2002-10-01',
      status: 'ACTIVE IN',
      inOutStatus: 'IN',
      prisonId: 'MDI',
      prisonName: 'HMP Moorland',
      cellLocation: '1-2-002',
      category: 'E',
      alerts: [{ alertCode: 'HA' }, { alertCode: 'PEEP' }],
      legalStatus: 'SENTENCED',
    },
  ],
} as unknown as PagePrisoner

describe('Route Handlers - Select people by residential location', () => {
  const handler = new SelectPeopleByResidentialLocationRoutes(activitiesService, prisonService, userService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      query: {
        date: '2025-09-19',
        sessionFilters: 'AM',
        locationKey: 'A-Wing',
      },
      journeyData: {
        recordAttendanceJourney: {},
      },
      body: {},
    } as unknown as Request

    when(activitiesService.getScheduledActivitiesAtPrisonByDateAndSlot)
      .calledWith(expect.any(Date), res.locals.user, TimeSlot.AM)
      .mockResolvedValue([scheduledActivity1, scheduledActivity2])

    when(activitiesService.getAttendeesForScheduledInstances)
      .calledWith([123456], res.locals.user)
      .mockResolvedValue([{ prisonerNumber: 'ABC123', scheduledInstanceId: 123456 }] as ScheduledAttendee[])

    when(activitiesService.getAttendeesForScheduledInstances)
      .calledWith([123457], res.locals.user)
      .mockResolvedValue([] as ScheduledAttendee[])

    when(activitiesService.getScheduledEventsForPrisoners)
      .calledWith(expect.any(Date), expect.any(Array), res.locals.user)
      .mockResolvedValue(scheduledEvents)

    when(activitiesService.getLocationGroups)
      .calledWith(res.locals.user)
      .mockResolvedValue(mockLocations as unknown as LocationGroup[])

    when(activitiesService.getPrisonLocationPrefixByGroup)
      .calledWith(atLeast('MDI', 'A-Wing', res.locals.user))
      .mockResolvedValueOnce({ locationPrefix: 'MDI-1-' })

    when(prisonService.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
  })

  describe('GET', () => {
    it('should render the expected view for a single instance', async () => {
      const dateString = '2025-09-19'
      const date = toDate(asString(dateString))
      const attendanceRows = [
        {
          prisoner: mapPrisonerDetails(prisoners.content[0]),
          attendances: [scheduledActivity1.attendances[0]],
          advancedAttendances: [],
          attendanceIds: [1001],
          instanceIds: [123456],
          instances: [updatedInstance1],
          otherEventsPerInstance: [[]],
          someSelectable: false,
        },
        {
          prisoner: mapPrisonerDetails(prisoners.content[1]),
          attendances: [scheduledActivity2.attendances[0]],
          advancedAttendances: [],
          attendanceIds: [1002],
          instanceIds: [123457],
          instances: [updatedInstance2],
          otherEventsPerInstance: [[]],
          someSelectable: false,
        },
      ] as unknown as ScheduledInstanceAttendance[]
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/attend-all/select-people-by-residential-location',
        {
          activityDate: date,
          attendanceRows,
          instance: updatedInstance1,
          instancesForDateAndSlot: [updatedInstance1, updatedInstance2],
          timePeriodFilter: 'AM',
          location: mockLocations[0],
        },
      )
    })
  })

  describe('NOT_ATTENDED', () => {
    it('should redirect to the correct location', async () => {
      req.body.selectedAttendances = ['123456,123457-2025-09-19-AM-ABC123', '123457-2025-09-19-AM-ABC321']
      await handler.NOT_ATTENDED(req, res)
      expect(res.redirect).toHaveBeenCalledWith('../multiple-not-attended-reason')
      expect(req.journeyData.recordAttendanceJourney.selectedInstanceIds).toEqual([
        '123456,123457-2025-09-19-AM-ABC123',
        '123457-2025-09-19-AM-ABC321',
      ])
    })
  })
})

const mapPrisonerDetails = prisoner => {
  return {
    prisonerNumber: prisoner.prisonerNumber,
    firstName: prisoner.firstName,
    lastName: prisoner.lastName,
    prisonId: prisoner.prisonId,
    cellLocation: prisoner.cellLocation,
    status: prisoner.status,
  }
}
