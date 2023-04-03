import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format } from 'date-fns'
import ActivitiesService from '../../../services/activitiesService'
import { Attendance, ScheduledActivity } from '../../../@types/activitiesAPI/types'
import PrisonService from '../../../services/prisonService'
import { Prisoner } from '../../../@types/prisonerOffenderSearchImport/types'
import RemovePayRoutes from './removePay'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/prisonService')

const activitiesService = new ActivitiesService(null, null)
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
        .calledWith(1, res.locals.user)
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

      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/remove-pay', {
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
    it('redirect as expected when the remove pay option is confirmed', async () => {
      req.body = {
        removePayOption: 'yes',
      }
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`/attendance/activities/1/attendance-details/1`)
    })
  })
})
