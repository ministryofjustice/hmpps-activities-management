import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { Attendance } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import ResetAttendanceRoutes, { ResetAttendance } from './resetAttendance'
import { YesNo } from '../../../../@types/activities'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null, null)
const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Reset Attendance', () => {
  const handler = new ResetAttendanceRoutes(activitiesService, prisonService)

  let req: Request
  let res: Response

  const attendance = {
    id: 1,
    prisonerNumber: 'ABC321',
    status: 'COMPLETED',
    attendanceReason: { code: 'ATTENDED' },
  } as Attendance

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
      params: { id: 1, attendanceId: 1 },
      body: {},
      session: {
        notAttendedJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    beforeEach(() => {
      when(activitiesService.getAttendanceDetails).mockResolvedValue(attendance)

      when(prisonService.getInmateByPrisonerNumber).calledWith('ABC321', res.locals.user).mockResolvedValue(prisoner)
    })

    it('should render with the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/reset-attendance', {
        attendance,
        attendee: prisoner,
      })
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      when(activitiesService.updateAttendances).mockResolvedValue()
    })

    it('should reset attendance and display success message when reset has been confirmed', async () => {
      when(activitiesService.getAttendanceDetails).mockResolvedValue(attendance)
      when(prisonService.getInmateByPrisonerNumber).calledWith('ABC321', res.locals.user).mockResolvedValue(prisoner)

      req.body.confirm = YesNo.YES

      await handler.POST(req, res)

      expect(activitiesService.updateAttendances).toHaveBeenCalledWith(
        [
          {
            id: 1,
            prisonCode: res.locals.user.activeCaseLoadId,
            status: AttendanceStatus.WAITING,
          },
        ],
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/attendance/activities/1/attendance-list',
        'Attendance reset',
        `Attendance for ${prisoner.firstName} ${prisoner.lastName} has been reset`,
      )
    })

    it('should return back to attendance list page and not reset attendance if not confirmed', async () => {
      req.body.confirm = YesNo.NO

      await handler.POST(req, res)

      expect(activitiesService.updateAttendances).toBeCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith('/activities/attendance/activities/1/attendance-list')
    })
  })

  describe('Validation', () => {
    it('validation fails when confirmation value not selected', async () => {
      const body = {}

      const requestObject = plainToInstance(ResetAttendance, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'confirm', error: "Select 'Yes' to confirm or 'No' to cancel" }])
    })

    it('validation should pass when valid confirmation option selected', async () => {
      const body = {
        confirm: YesNo.YES,
      }

      const requestObject = plainToInstance(ResetAttendance, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toHaveLength(0)
    })
  })
})
