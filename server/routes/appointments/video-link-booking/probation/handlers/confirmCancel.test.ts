import { Request, Response } from 'express'
import ConfirmCancelRoutes from './confirmCancel'
import ProbationBookingService from '../../../../../services/probationBookingService'

jest.mock('../../../../../services/probationBookingService')

describe('ConfirmCancelRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let probationBookingService: jest.Mocked<ProbationBookingService>
  let confirmCancelRoutes: ConfirmCancelRoutes

  beforeEach(() => {
    req = {
      session: {
        bookAProbationMeetingJourney: {
          prisoner: { prisonCode: 'PRISON1' },
          date: '2024-09-09',
        },
      },
      body: {},
      params: {},
    } as unknown as Request
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
    }

    probationBookingService = new ProbationBookingService(null) as jest.Mocked<ProbationBookingService>
    confirmCancelRoutes = new ConfirmCancelRoutes(probationBookingService)
  })

  describe('GET', () => {
    it('should render the correct view', async () => {
      await confirmCancelRoutes.GET(req as Request, res as Response)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/probation/confirm-cancel')
    })
  })

  describe('POST', () => {
    it('should cancel the booking and redirect', async () => {
      await confirmCancelRoutes.POST(req as Request, res as Response)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('confirmation')
      expect(probationBookingService.cancelVideoLinkBooking).toHaveBeenCalled()
    })
  })
})
