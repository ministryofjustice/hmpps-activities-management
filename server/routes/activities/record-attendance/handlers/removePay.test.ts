import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { Attendance, ScheduledActivity } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import RemovePayRoutes, { RemovePay } from './removePay'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import AttendanceReason from '../../../../enum/attendanceReason'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Remove Pay', () => {
  const handler = new RemovePayRoutes(activitiesService, prisonService)

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
      params: { id: 1, attendanceId: 1 },
      session: {
        notAttendedJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render with the expected view', async () => {
      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
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
        } as ScheduledActivity)

      when(activitiesService.getAttendanceDetails)
        .calledWith(1)
        .mockResolvedValue({
          id: 1,
          prisonerNumber: 'ABC321',
          status: 'COMPLETED',
          attendanceReason: { code: 'ATTENDED' },
        } as Attendance)

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('ABC321', res.locals.user)
        .mockResolvedValue({
          prisonerNumber: 'ABC321',
          firstName: 'Alan',
          lastName: 'Key',
          cellLocation: 'MDI-1-002',
          alerts: [],
          category: 'A',
        } as Prisoner)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/remove-pay', {
        instance: {
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
        },
        attendance: {
          attendanceReason: { code: 'ATTENDED' },
          id: 1,
          prisonerNumber: 'ABC321',
          status: 'COMPLETED',
        },
        attendee: {
          name: 'Alan Key',
        },
      })
    })
  })

  describe('POST', () => {
    it('Attendance is updated and a case note is added', async () => {
      req.body = { removePayOption: 'yes', caseNote: 'test case note' }

      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
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
        } as ScheduledActivity)

      await handler.POST(req, res)

      expect(activitiesService.updateAttendances).toHaveBeenCalledWith(
        [
          {
            id: 1,
            prisonCode: 'MDI',
            status: AttendanceStatus.COMPLETED,
            attendanceReason: AttendanceReason.ATTENDED,
            issuePayment: false,
            payAmount: null as number,
            caseNote: 'Pay removed - Maths level 1 - Houseblock 1 - Friday, 12 January 2024 - 10:00\n\ntest case note',
          },
        ],
        { activeCaseLoadId: 'MDI', username: 'joebloggs' },
      )
      expect(res.redirect).toHaveBeenCalledWith(`/activities/attendance/activities/1/attendance-details/1`)
    })

    it('redirect as expected when the remove pay option is confirmed', async () => {
      req.body = {
        removePayOption: 'yes',
      }
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`/activities/attendance/activities/1/attendance-details/1`)
    })
  })

  describe('Validation', () => {
    it('should pass validation when remove pay option is set to "no"', async () => {
      const body = {
        removePayOption: 'no',
      }

      const requestObject = plainToInstance(RemovePay, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([])
    })

    it('should pass validation when remove pay option is set to "yes" and case note entered', async () => {
      const body = {
        removePayOption: 'yes',
        caseNote: 'case note',
      }

      const requestObject = plainToInstance(RemovePay, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([])
    })

    it('should fail validation when remove pay option not provided', async () => {
      const body = {}

      const requestObject = plainToInstance(RemovePay, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: "Confirm if you want to remove this person's pay or not",
            property: 'removePayOption',
          },
        ]),
      )
    })

    it('should fail validation when remove pay option set to "yes" but no case note provided', async () => {
      const body = {
        removePayOption: 'yes',
      }

      const requestObject = plainToInstance(RemovePay, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Enter a case note', property: 'caseNote' }]))
    })

    it('should fail validation when remove pay option set to "yes" but case note exceeds character limit', async () => {
      const body = {
        removePayOption: 'yes',
        caseNote: 'a'.repeat(3801),
      }

      const requestObject = plainToInstance(RemovePay, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ error: 'Case note must be 3800 characters or less', property: 'caseNote' }]),
      )
    })
  })
})
