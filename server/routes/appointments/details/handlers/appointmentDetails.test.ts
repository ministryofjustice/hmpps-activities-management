import { Request, Response } from 'express'
import { addHours, subMinutes } from 'date-fns'
import AppointmentDetailsRoutes from './appointmentDetails'
import { AppointmentSeriesDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'

describe('Route Handlers - Appointment Details', () => {
  const handler = new AppointmentDetailsRoutes()
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
      appointment: {
        occurrences: [
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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/details/appointment', {
        appointment: req.appointmentSeries,
      })
    })

    it('should remove occurrences in the past', async () => {
      const now = new Date()
      const todayOneMinuteInThePast = subMinutes(now, 1)
      const todayOneHourInTheFuture = addHours(now, 1)

      req.appointmentSeries.occurrences[0].startDate = formatDate(todayOneMinuteInThePast, 'yyyy-MM-dd')
      req.appointmentSeries.occurrences[0].startTime = formatDate(todayOneMinuteInThePast, 'HH:mm')
      req.appointmentSeries.occurrences[1].startDate = formatDate(todayOneHourInTheFuture, 'yyyy-MM-dd')
      req.appointmentSeries.occurrences[1].startTime = formatDate(todayOneHourInTheFuture, 'HH:mm')

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/details/appointment', {
        appointment: req.appointmentSeries,
      })
    })
  })
})
