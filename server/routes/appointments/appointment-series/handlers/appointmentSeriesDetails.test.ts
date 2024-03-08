import { Request, Response } from 'express'
import { addHours, subMinutes } from 'date-fns'
import { when } from 'jest-when'
import AppointmentSeriesDetailsRoutes from './appointmentSeriesDetails'
import { AppointmentSeriesDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'
import UserService from '../../../../services/userService'
import atLeast from '../../../../../jest.setup'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'

jest.mock('../../../../services/userService')

const userService = new UserService(null, null, null) as jest.Mocked<UserService>

describe('Route Handlers - Appointment Series Details', () => {
  const handler = new AppointmentSeriesDetailsRoutes(userService)
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
      appointmentSeries: {
        appointments: [
          {
            id: 10,
            sequenceNumber: 1,
          },
          {
            id: 11,
            sequenceNumber: 2,
          },
        ],
        createdBy: 'joebloggs',
      } as unknown as AppointmentSeriesDetails,
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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment-series/details', {
        appointmentSeries: req.appointmentSeries,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
      })
    })

    it('should remove appointments in the past', async () => {
      const now = new Date()
      const todayOneMinuteInThePast = subMinutes(now, 1)
      const todayOneHourInTheFuture = addHours(now, 1)

      req.appointmentSeries.appointments[0].startDate = formatDate(todayOneMinuteInThePast, 'yyyy-MM-dd')
      req.appointmentSeries.appointments[0].startTime = formatDate(todayOneMinuteInThePast, 'HH:mm')
      req.appointmentSeries.appointments[1].startDate = formatDate(todayOneHourInTheFuture, 'yyyy-MM-dd')
      req.appointmentSeries.appointments[1].startTime = formatDate(todayOneHourInTheFuture, 'HH:mm')

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment-series/details', {
        appointmentSeries: req.appointmentSeries,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
      })
    })
  })
})
