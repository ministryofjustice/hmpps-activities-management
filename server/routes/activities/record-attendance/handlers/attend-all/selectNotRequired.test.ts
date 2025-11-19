import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import { AdvanceAttendance, ScheduledActivity } from '../../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import SelectNotRequiredRoutes from './selectNotRequired'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/userService')
jest.mock('../../../../../services/prisonService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)

const today = format(new Date(), 'yyyy-MM-dd')

const scheduledActivity1 = {
  id: 123456,
  date: today,
  startTime: '08:45',
  endTime: '11:45',
  timeSlot: 'AM',
  cancelled: false,
  comment: null,
  attendances: [],
  advanceAttendances: [],
  activitySchedule: {
    id: 518,
    description: 'A Wing Cleaner 2',
    internalLocation: null,
    activity: {
      id: 539,
      paid: true,
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
  attendances: [],
  advanceAttendances: [],
  activitySchedule: {
    id: 518,
    description: 'A Wing Cleaner 2',
    internalLocation: null,
    activity: {
      id: 539,
      paid: false,
    },
    startDate: '2023-10-24',
    endDate: '2026-10-05',
  },
} as unknown as ScheduledActivity

const prisoners = [
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
] as unknown as Prisoner[]

describe('Route Handlers - Select not required sessions', () => {
  const handler = new SelectNotRequiredRoutes(activitiesService, prisonService)
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
        recordAttendanceJourney: {
          selectedInstanceIds: ['123456,123457-111,112-ABC123', '123457-111,112-ABC321'],
          returnUrl: '/activities/attendance/activities',
        },
      },
      body: {},
    } as unknown as Request

    when(activitiesService.getScheduledActivities)
      .calledWith([123456, 123457], res.locals.user)
      .mockResolvedValue([scheduledActivity1, scheduledActivity2])

    when(prisonService.searchInmatesByPrisonerNumbers).mockResolvedValue(prisoners)

    when(activitiesService.postAdvanceAttendances)
      .calledWith(
        {
          scheduleInstanceId: 123456,
          prisonerNumber: 'ABC123',
          issuePayment: true,
        },
        res.locals.user,
      )
      .mockResolvedValue({} as unknown as AdvanceAttendance)

    when(activitiesService.postAdvanceAttendances)
      .calledWith(
        {
          scheduleInstanceId: 123457,
          prisonerNumber: 'ABC123',
          issuePayment: true,
        },
        res.locals.user,
      )
      .mockResolvedValue({} as unknown as AdvanceAttendance)
  })

  describe('GET', () => {
    it('should render the expected view with not required instances, excluding those with advance attendances', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attend-all/select-not-required', {
        attendanceDetails: [
          {
            prisonerNumber: 'ABC123',
            firstName: 'One',
            lastName: 'Onester',
            instances: [scheduledActivity1, scheduledActivity2],
            isPayable: true,
          },
          {
            prisonerNumber: 'ABC321',
            firstName: 'Two',
            lastName: 'Twoster',
            instances: [scheduledActivity2],
            isPayable: false,
          },
        ],
        backLink: '/activities/attendance/activities',
      })
    })
  })

  describe('POST', () => {
    it('should call postAdvanceAttendances for each selected prisoner and instance', async () => {
      req.body = {
        notRequiredData: [
          {
            prisonerNumber: 'ABC123',
            prisonerName: 'One Onester',
            selectedInstanceIds: ['123456', '123457'],
            shouldBePaid: true,
          },
        ],
      }

      await handler.POST(req, res)

      expect(activitiesService.postAdvanceAttendances).toHaveBeenCalledTimes(2)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/attendance/activities',
        'Not required recorded',
        "You've marked 1 person as not required.",
      )
    })
  })
})
