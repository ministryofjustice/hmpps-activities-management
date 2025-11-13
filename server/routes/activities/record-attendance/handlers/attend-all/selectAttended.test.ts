import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import SelectAttendedRoutes from './selectAttended'

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

describe('Route Handlers - Select attended sessions', () => {
  const handler = new SelectAttendedRoutes(activitiesService, prisonService)
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
        },
      },
      body: {},
    } as unknown as Request

    when(activitiesService.getScheduledActivities)
      .calledWith([123456, 123457], res.locals.user)
      .mockResolvedValue([scheduledActivity1, scheduledActivity2])

    when(prisonService.searchInmatesByPrisonerNumbers).mockResolvedValue(prisoners)
  })

  describe('GET', () => {
    it('should render the expected view with only not attended instances', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attend-all/select-attended', {
        attendanceDetails: [
          {
            prisonerNumber: 'ABC123',
            firstName: 'One',
            lastName: 'Onester',
            instances: [scheduledActivity1],
          },
          {
            prisonerNumber: 'ABC321',
            firstName: 'Two',
            lastName: 'Twoster',
            instances: [],
          },
        ],
        requiredSelections: [],
        backLink: req.journeyData.recordAttendanceJourney.returnUrl || 'choose-details-by-residential-location',
      })
    })
  })
})
