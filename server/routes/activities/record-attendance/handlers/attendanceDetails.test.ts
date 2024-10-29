import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { Attendance, ScheduledActivity } from '../../../../@types/activitiesAPI/types'
import AttendanceDetailsRoutes from './attendanceDetails'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import UserService from '../../../../services/userService'
import atLeast from '../../../../../jest.setup'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/userService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)
const userService = new UserService(null, null, null) as jest.Mocked<UserService>

describe('Route Handlers - View and Edit Attendance', () => {
  const handler = new AttendanceDetailsRoutes(activitiesService, prisonService, userService)

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
        recordAttendanceJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it.each([
      ['available', true],
      ['not available', false],
    ])(
      'should render with the expected view when journey session is %s',
      async (_: string, sessionIsAvailable: boolean) => {
        if (sessionIsAvailable) {
          req.session.recordAttendanceJourney.singleInstanceSelected = true
        }

        when(userService.getUserMap)
          .calledWith(atLeast(['joebloggs', 'jsmith']))
          .mockResolvedValue(
            new Map([
              ['joebloggs', { name: 'Joe Bloggs' }],
              ['jsmith', { name: 'John Smith' }],
            ]) as Map<string, UserDetails>,
          )

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
            recordedBy: 'joebloggs',
            attendanceHistory: [
              {
                attendanceReason: { code: 'REST' },
                recordedBy: 'jsmith',
              },
            ],
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

        expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/attendance-details', {
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
            recordedBy: 'joebloggs',
            attendanceHistory: [
              {
                attendanceReason: { code: 'REST' },
                recordedBy: 'jsmith',
              },
            ],
          },
          attendee: {
            name: 'Alan Key',
          },
          activity: { summary: 'Maths level 1' },
          userMap: new Map([
            ['joebloggs', { name: 'Joe Bloggs' }],
            ['jsmith', { name: 'John Smith' }],
          ]) as Map<string, UserDetails>,
        })
      },
    )
  })

  describe('POST', () => {
    it('should redirect to remove pay page', async () => {
      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('1/remove-pay')
    })
  })
})
