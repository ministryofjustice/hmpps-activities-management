import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import { AdvanceAttendance } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import ResetAdvanceAttendanceRoutes from './resetAdvanceAttendance'
import config from '../../../../config'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Reset Advance Attendance', () => {
  config.notRequiredInAdvanceEnabled = true

  const handler = new ResetAdvanceAttendanceRoutes(activitiesService, prisonService)

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
    when(activitiesService.deleteAdvanceAttendance).mockResolvedValue({} as AdvanceAttendance)
    when(prisonService.getInmateByPrisonerNumber).calledWith('ABC321', res.locals.user).mockResolvedValue(prisoner)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render reset advance attendance view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/reset-advance-attendance', {
        advanceAttendance,
        attendee: prisoner,
      })
    })
  })

  describe('POST', () => {
    it('should redirect to attendance list with success', async () => {
      await handler.POST(req, res)

      expect(activitiesService.deleteAdvanceAttendance).toHaveBeenCalledWith(1, res.locals.user)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../../attendance-list',
        'Attendance reset',
        `The attendance record for ${prisoner.firstName} ${prisoner.lastName} has been reset.`,
      )
    })
  })
})
