import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import AttendanceDetailsRoutes from './attendanceDetails'
import UserService from '../../../../services/userService'
import atLeast from '../../../../../jest.setup'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/userService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const userService = new UserService(null, null, null) as jest.Mocked<UserService>

describe('Route Handlers - Edit Appointment Attendance', () => {
  const handler = new AttendanceDetailsRoutes(activitiesService, userService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
        },
      },
      render: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        appointmentId: '123',
        prisonerNumber: 'ZB1123S',
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('Should render the page', async () => {
      const appointment = {
        id: 123,
        appointmentName: 'Chaplaincy',
        startDate: '2024-12-01',
        attendees: [
          {
            attendanceRecordedBy: 'jsmith',
            attendanceRecordedTime: '2025-01-07T15:20:14',
            attended: true,
            prisoner: {
              prisonerNumber: 'DD111D',
              firstName: 'Steve',
              lastName: 'Jones',
            },
          },
          {
            attendanceRecordedBy: 'jsmith',
            attendanceRecordedTime: '2025-01-07T15:20:14',
            attended: true,
            prisoner: {
              prisonerNumber: 'ZB1123S',
              firstName: 'Joe',
              lastName: 'Bloggs',
            },
          },
        ],
      } as AppointmentDetails

      when(activitiesService.getAppointmentDetails).calledWith(123, res.locals.user).mockResolvedValue(appointment)

      when(userService.getUserMap)
        .calledWith(atLeast(['jsmith']))
        .mockResolvedValue(new Map([['jsmith', { name: 'John Smith' }]]) as Map<string, UserDetails>)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/attendance-details', {
        attendanceDetails: {
          appointmentId: 123,
          appointmentName: 'Chaplaincy',
          appointmentDate: '2024-12-01',
          recordedBy: 'jsmith',
          recordedTime: '2025-01-07T15:20:14',
          attended: true,
          prisonerName: 'Joe Bloggs',
          prisonerNumber: 'ZB1123S',
        },
        userMap: new Map([['jsmith', { name: 'John Smith' }]]) as Map<string, UserDetails>,
      })
    })
  })
})
