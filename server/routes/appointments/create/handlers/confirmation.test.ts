import { Request, Response } from 'express'
import ConfirmationRoutes from './confirmation'

describe('Route Handlers - Create Appointment - Confirmation', () => {
  const handler = new ConfirmationRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createAppointmentJourney: {
          prisoner: {
            number: 'A1234BC',
            name: 'Test Prisoner',
            cellLocation: '1-1-1',
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
            date: '2023-04-23T00:00:00.000+0100',
          },
          startTime: {
            hour: 9,
            minute: 30,
            date: '2023-04-23T09:30:00.000+0100',
          },
          endTime: {
            hour: 13,
            minute: 0,
            date: '2023-04-23T13:00:00.000+0100',
          },
        },
      },
      params: {
        id: '1',
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the confirmation page with data from session', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create/confirmation', {
        id: '1',
        startDate: new Date('2023-04-23T00:00:00.000+0100'),
      })
    })

    it('should clear session', async () => {
      await handler.GET(req, res)
      expect(req.session.createAppointmentJourney).toBeNull()
    })
  })
})
