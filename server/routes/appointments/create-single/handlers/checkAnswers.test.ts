import { Request, Response } from 'express'
import CheckAnswersRoutes from './checkAnswers'
import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create Single Appointment - Check answers', () => {
  const handler = new CheckAnswersRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createSingleAppointmentJourney: {
          prisoner: {
            number: 'A1234BC',
            bookingId: 456,
            displayName: 'Prisoner, Test',
          },
          category: {
            id: 11,
            description: 'Medical - Doctor',
          },
          location: {
            id: 32,
            description: 'Interview Room',
          },
          startDate: {
            day: 23,
            month: 4,
            year: 2023,
          },
          startTime: '09:30',
          endTime: '11:00',
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page with data from session', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-single/check-answers', {
        startDate: '23rd April 2023',
        startTime: '09:00',
        endTime: '10:30',
      })
    })
  })
})
