import { Request, Response } from 'express'
import ConfirmCancelRoutes from './confirmCancel'
import CourtBookingService from '../../../../../services/courtBookingService'

jest.mock('../../../../../services/courtBookingService')

describe('ConfirmCancelRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let courtBookingService: jest.Mocked<CourtBookingService>
  let confirmCancelRoutes: ConfirmCancelRoutes

  beforeEach(() => {
    req = {
      session: {
        bookACourtHearingJourney: {
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

    courtBookingService = new CourtBookingService(null) as jest.Mocked<CourtBookingService>
    confirmCancelRoutes = new ConfirmCancelRoutes(courtBookingService)
  })

  describe('GET', () => {
    it('should render the correct view', async () => {
      await confirmCancelRoutes.GET(req as Request, res as Response)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/court/confirm-cancel')
    })
  })

  describe('POST', () => {
    it('should cancel the booking and redirect', async () => {
      await confirmCancelRoutes.POST(req as Request, res as Response)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('confirmation')
      expect(courtBookingService.cancelVideoLinkBooking).toHaveBeenCalled()
    })
  })
})
