import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { AdvanceAttendance, ScheduledActivity } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import config from '../../../../config'
import AdvanceAttendanceChangePayRoutes from './advanceAttendanceChangePay'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)

const instance = {
  id: 1,
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '10:00',
  endTime: '11:00',
  activitySchedule: {
    activity: { summary: 'Maths level 1', paid: true },
    internalLocation: { description: 'Houseblock 1' },
  },
  attendances: [
    { prisonerNumber: 'ABC123', status: 'WAITING' },
    { prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
    { prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
  ],
} as ScheduledActivity

describe('Route Handlers - Advance Attendance change pay', () => {
  config.notRequiredInAdvanceEnabled = true

  const handler = new AdvanceAttendanceChangePayRoutes(activitiesService, prisonService)

  let req: Request
  let res: Response

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
          activeCaseLoadId: 123,
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      session: {},
      params: { advanceAttendanceId: 1 },
      body: {},
    } as unknown as Request

    when(activitiesService.getAdvanceAttendanceDetails).mockResolvedValue(advanceAttendance)
    when(activitiesService.putAdvanceAttendance).mockResolvedValue({} as AdvanceAttendance)
    when(prisonService.getInmateByPrisonerNumber).calledWith('ABC321', res.locals.user).mockResolvedValue(prisoner)
    when(activitiesService.getScheduledActivity).mockResolvedValue(instance)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render reset advance attendance view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/advance-attendance-change-pay', {
        advanceAttendance,
        attendee: prisoner,
        instance,
      })
    })
    it('should redirect back to list view for unpaid activity', async () => {
      instance.activitySchedule.activity.paid = false
      when(activitiesService.getScheduledActivity).mockResolvedValue(instance)

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('../../attendance-list')
    })
  })

  describe('POST', () => {
    it('should redirect to attendance list with success', async () => {
      await handler.POST(req, res)

      expect(activitiesService.putAdvanceAttendance).toHaveBeenCalledWith(1, true, res.locals.user)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../../attendance-list',
        'Pay updated',
        `${prisoner.firstName} ${prisoner.lastName} will now be paid for this session.`,
      )
    })
  })
})
