import { Request, Response } from 'express'
import { when } from 'jest-when'
import OccurrenceDetailsRoutes from './occurrenceDetails'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentOccurrenceDetails } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Appointment Occurrence Details', () => {
  const handler = new OccurrenceDetailsRoutes(activitiesService)
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
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(activitiesService.getAppointmentOccurrenceDetails)
        .calledWith(10, res.locals.user)
        .mockResolvedValue(occurrenceDetails)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/occurrence-details/occurrence', {
        occurrence: occurrenceDetails,
      })
    })
  })
})
