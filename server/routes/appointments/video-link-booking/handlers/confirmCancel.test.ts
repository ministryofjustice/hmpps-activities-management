import { Request, Response } from 'express'
import ConfirmCancelRoutes from './confirmCancel'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'

jest.mock('../../../../services/bookAVideoLinkService')

describe('ConfirmCancelRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let confirmCancelRoutes: ConfirmCancelRoutes

  beforeEach(() => {
    req = {
      session: {
        bookAVideoLinkJourney: {
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

    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    confirmCancelRoutes = new ConfirmCancelRoutes(bookAVideoLinkService)
  })

  describe('GET', () => {
    it('should render the correct view', async () => {
      await confirmCancelRoutes.GET(req as Request, res as Response)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/confirm-cancel')
    })
  })

  describe('POST', () => {
    it('should cancel the booking and redirect', async () => {
      await confirmCancelRoutes.POST(req as Request, res as Response)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('confirmation')
      expect(bookAVideoLinkService.cancelVideoLinkBooking).toHaveBeenCalled()
    })
  })
})
