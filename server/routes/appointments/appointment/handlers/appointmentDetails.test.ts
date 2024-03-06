import { Request, Response } from 'express'
import { addDays } from 'date-fns'
import { when } from 'jest-when'
import AppointmentDetailsRoutes from './appointmentDetails'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'
import UserService from '../../../../services/userService'
import atLeast from '../../../../../jest.setup'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'

jest.mock('../../../../services/userService')

const userService = new UserService(null, null, null) as jest.Mocked<UserService>

describe('Route Handlers - Appointment Details', () => {
  const handler = new AppointmentDetailsRoutes(userService)
  const tomorrow = addDays(new Date(), 1)

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
    when(userService.getUserMap)
      .calledWith(atLeast(['joebloggs', 'joebloggs', 'joebloggs']))
      .mockResolvedValue(new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      const appointment = {
        id: 10,
        appointmentSeries: {
          id: 9,
        },
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        startTime: '23:59',
        createdBy: 'joebloggs',
        updatedBy: 'joebloggs',
        cancelledBy: 'joebloggs',
      } as AppointmentDetails

      req = {
        params: {
          id: '10',
        },
        appointment,
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment/details', {
        appointment,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
      })
    })
  })
})
