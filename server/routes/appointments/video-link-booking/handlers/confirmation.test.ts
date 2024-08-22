import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import BookAVideoLinkApiClient from '../../../../data/bookAVideoLinkApiClient'
import ConfirmationRoutes from './confirmation'
import { Court, VideoLinkBooking } from '../../../../@types/bookAVideoLinkApi/types'

jest.mock('../../../../services/bookAVideoLinkService')
jest.mock('../../../../data/bookAVideoLinkApiClient')

describe('ConfirmationRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let confirmationRoutes: ConfirmationRoutes
  let bookAVideoLinkApiClient: jest.Mocked<BookAVideoLinkApiClient>

  beforeEach(() => {
    req = {
      session: {
        bookAVideoLinkJourney: {
          prisoner: { prisonCode: 'PRISON1' },
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
      redirect: jest.fn(),
    }
    bookAVideoLinkApiClient = new BookAVideoLinkApiClient() as jest.Mocked<BookAVideoLinkApiClient>
    bookAVideoLinkService = new BookAVideoLinkService(bookAVideoLinkApiClient) as jest.Mocked<BookAVideoLinkService>
    confirmationRoutes = new ConfirmationRoutes(bookAVideoLinkService)
  })

  describe('GET', () => {
    it('should render the confirmation page with video link booking and court details', async () => {
      const vlb = { videoLinkBookingId: 1, bookingType: 'COURT', courtCode: 'Court1' } as VideoLinkBooking
      const court = { courtId: 1, code: 'Court1', description: 'Disabled Court', enabled: false } as Court
      bookAVideoLinkService.getVideoLinkBookingById.mockResolvedValue(vlb)
      bookAVideoLinkService.getAllCourts.mockResolvedValue([court])

      req.params = { vlbId: '1' }

      await confirmationRoutes.GET(req as Request, res as Response)

      expect(bookAVideoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, res.locals.user)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/confirmation', { vlb, court })
    })
  })
})
