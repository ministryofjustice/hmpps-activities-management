import { Request, Response } from 'express'
import CancelConfirmedRoutes from './cancelConfirmed'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import { Court } from '../../../../@types/bookAVideoLinkApi/types'

jest.mock('../../../../services/bookAVideoLinkService')

describe('CancelConfirmedRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let cancelConfirmedRoutes: CancelConfirmedRoutes

  beforeEach(() => {
    req = {
      session: {
        bookAVideoLinkJourney: {
          agencyCode: 'code',
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
      redirect: jest.fn(),
    }

    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    cancelConfirmedRoutes = new CancelConfirmedRoutes(bookAVideoLinkService)
  })

  describe('GET', () => {
    it('should render the confirmation page', async () => {
      const court = { courtId: 1, code: 'code', description: 'Disabled Court', enabled: false } as Court
      bookAVideoLinkService.getAllCourts.mockResolvedValue([court])

      await cancelConfirmedRoutes.GET(req as Request, res as Response)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/booking-cancelled', {
        date: '2024-09-09',
        agency: court,
      })
    })
  })
})
