import { Request, Response } from 'express'
import { addDays, subDays } from 'date-fns'
import { when } from 'jest-when'
import AppointmentDetailsRoutes, { isAppointmentUncancellable } from './appointmentDetails'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate, toDateString } from '../../../../utils/utils'
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
  let appointment: AppointmentDetails

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

    appointment = {
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

    when(userService.getUserMap)
      .calledWith(atLeast(['joebloggs', 'joebloggs', 'joebloggs']))
      .mockResolvedValue(new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
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

  describe('COPY', () => {
    it('should render the expected view', async () => {
      req = {
        params: {
          id: '10',
        },
        appointment,
      } as unknown as Request

      await handler.COPY(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment/copy', {
        appointment,
      })
    })
  })

  describe('uncancellable appointments', () => {
    it('appointment cancelled 5 days ago can be uncancelled', async () => {
      appointment.isCancelled = true
      appointment.startDate = toDateString(subDays(new Date(), 5))

      const canCancel: boolean = isAppointmentUncancellable(appointment)

      expect(canCancel).toEqual(true)
    })

    it('appointment cancelled 6 days ago can be cannot be uncancelled', async () => {
      appointment.isCancelled = true
      appointment.startDate = toDateString(subDays(new Date(), 6))

      const canCancel: boolean = isAppointmentUncancellable(appointment)

      expect(canCancel).toEqual(false)
    })

    it('should render the expected view for an appointment cancelled 5 days ago can be uncancelled', async () => {
      req = {
        params: {
          id: '10',
        },
        appointment,
      } as unknown as Request

      appointment.isCancelled = true
      appointment.startDate = toDateString(subDays(new Date(), 5))

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment/details', {
        appointment,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
        appointmentUncancellable: true,
      })
    })

    it('should render the expected view for an appointment cancelled 6 days ago can be cannot be uncancelled', async () => {
      req = {
        params: {
          id: '10',
        },
        appointment,
      } as unknown as Request

      appointment.isCancelled = true
      appointment.startDate = toDateString(subDays(new Date(), 6))

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment/details', {
        appointment,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
        appointmentUncancellable: false,
      })
    })
  })
})
