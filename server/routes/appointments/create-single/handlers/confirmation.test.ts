import { Request, Response } from 'express'
import ConfirmationRoutes from './confirmation'

describe('Route Handlers - Create Single Appointment - Confirmation', () => {
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
        createSingleAppointmentJourney: {
          prisoner: {
            number: 'A1234BC',
            displayName: 'Test Prisoner',
            cellLocation: '1-1-1',
            description: 'Test Prisoner | A1234BC | 1-1-1',
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
            display: 'Sunday 23 April 2023',
          },
          startTime: {
            hour: 9,
            minute: 30,
            display: '09:30',
          },
          endTime: {
            hour: 13,
            minute: 0,
            display: '13:00',
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
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-single/confirmation', {
        id: '1',
        confirmationMessage:
          'You have successfully created a Medical - Doctor appointment for Test Prisoner | A1234BC | 1-1-1 at 09:30 to 13:00 on Sunday 23 April 2023 in the Interview Room.',
      })
    })
  })
})
