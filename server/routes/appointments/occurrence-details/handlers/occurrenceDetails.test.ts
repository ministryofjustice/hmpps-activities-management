import { Request, Response } from 'express'
import { addDays } from 'date-fns'
import OccurrenceDetailsRoutes from './occurrenceDetails'
import { AppointmentOccurrenceDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'

describe('Route Handlers - Appointment Occurrence Details', () => {
  const handler = new OccurrenceDetailsRoutes()
  const tomorrow = addDays(new Date(), 1)
  const yesterday = addDays(new Date(), -1)

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
    it('should render the expected view for future appointment', async () => {
      const occurrenceDetails = {
        id: 10,
        appointmentId: 9,
        startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
        startTime: '23:59',
      } as AppointmentOccurrenceDetails

      req = {
        params: {
          id: '10',
        },
        appointmentOccurrence: occurrenceDetails,
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/occurrence-details/occurrence', {
        occurrence: occurrenceDetails,
        appointmentInPast: false,
      })
    })

    it('should render the expected view for past appointment', async () => {
      const occurrenceDetails = {
        id: 10,
        appointmentId: 9,
        startDate: formatDate(yesterday, 'yyyy-MM-dd'),
        startTime: '23:59',
      } as AppointmentOccurrenceDetails

      req = {
        params: {
          id: '10',
        },
        appointmentOccurrence: occurrenceDetails,
      } as unknown as Request
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/occurrence-details/occurrence', {
        occurrence: occurrenceDetails,
        appointmentInPast: true,
      })
    })
  })
})
