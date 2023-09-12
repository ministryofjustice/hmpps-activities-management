import { Request, Response } from 'express'
import { addDays } from 'date-fns'
import AppointmentDetailsRoutes from './appointmentDetails'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'

describe('Route Handlers - Appointment Details', () => {
  const handler = new AppointmentDetailsRoutes()
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
      })
    })
  })
})
