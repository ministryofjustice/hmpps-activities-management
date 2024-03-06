import { Request, Response } from 'express'
import { when } from 'jest-when'
import AppointmentSetDetailsRoutes from './appointmentSetDetails'
import { AppointmentDetails, AppointmentSetDetails } from '../../../../@types/activitiesAPI/types'
import UserService from '../../../../services/userService'
import atLeast from '../../../../../jest.setup'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'

jest.mock('../../../../services/userService')

const userService = new UserService(null, null, null) as jest.Mocked<UserService>

describe('Route Handlers - Appointment Set Details', () => {
  const handler = new AppointmentSetDetailsRoutes(userService)
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
      params: {
        id: '10',
      },
      appointmentSet: {
        appointments: [],
        createdBy: 'joebloggs',
      } as unknown as AppointmentSetDetails,
    } as unknown as Request

    when(userService.getUserMap)
      .calledWith(atLeast(['joebloggs']))
      .mockResolvedValue(new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment-set/details', {
        appointmentSet: req.appointmentSet,
        showPrintMovementSlipsLink: false,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
      })
    })

    it('should render print movement slips link when at least one appointment is not cancelled and not expired', async () => {
      req.appointmentSet.appointments = [
        {
          isCancelled: false,
          isExpired: true,
        } as unknown as AppointmentDetails,
        {
          isCancelled: true,
          isExpired: false,
        } as unknown as AppointmentDetails,
        {
          isCancelled: false,
          isExpired: false,
        } as unknown as AppointmentDetails,
      ]

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment-set/details', {
        appointmentSet: req.appointmentSet,
        showPrintMovementSlipsLink: true,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
      })
    })

    it('should not render print movement slips link when all appointments are either cancelled, expired or both', async () => {
      req.appointmentSet.appointments = [
        {
          isCancelled: false,
          isExpired: true,
        } as unknown as AppointmentDetails,
        {
          isCancelled: true,
          isExpired: false,
        } as unknown as AppointmentDetails,
        {
          isCancelled: true,
          isExpired: true,
        } as unknown as AppointmentDetails,
      ]

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment-set/details', {
        appointmentSet: req.appointmentSet,
        showPrintMovementSlipsLink: false,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
      })
    })
  })
})
