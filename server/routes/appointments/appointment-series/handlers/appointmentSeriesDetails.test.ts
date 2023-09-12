import { Request, Response } from 'express'
import { addHours, subMinutes } from 'date-fns'
import AppointmentSeriesDetailsRoutes from './appointmentSeriesDetails'
import { AppointmentSeriesDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'

describe('Route Handlers - Appointment Series Details', () => {
  const handler = new AppointmentSeriesDetailsRoutes()
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
      } as unknown as AppointmentSeriesDetails,
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment-series/details', {
        appointmentSeries: req.appointmentSeries,
      })
    })

    it('should remove occurrences in the past', async () => {
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
      })
    })
  })
})
