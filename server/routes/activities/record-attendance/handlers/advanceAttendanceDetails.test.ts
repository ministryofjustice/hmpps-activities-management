import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { AdvanceAttendance, ScheduledActivity } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import UserService from '../../../../services/userService'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'
import AdvanceAttendanceDetailsRoutes from './advanceAttendanceDetails'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/userService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)
const userService = new UserService(null, null, null) as jest.Mocked<UserService>

describe('Route Handlers - View and Edit Advance Attendance', () => {
  const handler = new AdvanceAttendanceDetailsRoutes(activitiesService, prisonService, userService)

  let req: Request
  let res: Response

  const userMap = new Map([
    ['joebloggs', { name: 'Joe Bloggs' }],
    ['jsmith', { name: 'John Smith' }],
  ]) as Map<string, UserDetails>

  const instance = {
    id: 1,
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '11:00',
    activitySchedule: {
      activity: { summary: 'Maths level 1' },
      internalLocation: { description: 'Houseblock 1' },
    },
    attendances: [
      { prisonerNumber: 'ABC123', status: 'WAITING' },
      { prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
      { prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
    ],
  } as ScheduledActivity

  const advanceAttendance = {
    id: 1,
    scheduleInstanceId: 301981,
    prisonerNumber: 'ABC321',
    issuePayment: false,
    payAmount: null,
    recordedTime: '2025-07-03T15:52:02',
    recordedBy: 'AYOUNGMAN_GEN',
    attendanceHistory: [],
  } as AdvanceAttendance

  const prisoner = {
    prisonerNumber: 'ABC321',
    firstName: 'Alan',
    lastName: 'Key',
    cellLocation: 'MDI-1-002',
    alerts: [],
    category: 'A',
  } as Prisoner

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
      params: { advanceAttendanceId: 1 },
      session: {
        recordAttendanceJourney: {},
      },
    } as unknown as Request

    when(activitiesService.getAdvanceAttendanceDetails).mockResolvedValue(advanceAttendance)
    when(userService.getUserMap).mockResolvedValue(userMap)
    when(activitiesService.getScheduledActivity).mockResolvedValue(instance)
    when(prisonService.getInmateByPrisonerNumber).mockResolvedValue(prisoner)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render advance attendance detail view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/advance-attendance-details', {
        instance,
        advanceAttendance,
        attendee: prisoner,
        userMap,
      })
    })
  })

  describe('POST', () => {
    it('should redirect to reset page', async () => {
      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('1/reset')
    })
  })
})
