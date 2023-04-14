import { Request, Response } from 'express'
import OccurrenceDetailsRoutes from './occurrenceDetails'
import { AppointmentOccurrenceDetails } from '../../../../@types/activitiesAPI/types'

describe('Route Handlers - Appointment Occurrence Details', () => {
  const handler = new OccurrenceDetailsRoutes()
  let req: Request
  let res: Response

  const occurrenceDetails = {
    id: 10,
    appointmentId: 9,
  } as AppointmentOccurrenceDetails

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
      appointmentOccurrence: occurrenceDetails,
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/occurrence-details/occurrence', {
        occurrence: occurrenceDetails,
      })
    })
  })
})
