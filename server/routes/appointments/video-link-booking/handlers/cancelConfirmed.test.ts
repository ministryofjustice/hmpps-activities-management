import { Request, Response } from 'express'
import CancelConfirmedRoutes from './cancelConfirmed'

describe('CancelConfirmedRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let cancelConfirmedRoutes: CancelConfirmedRoutes

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
      redirect: jest.fn(),
    }

    cancelConfirmedRoutes = new CancelConfirmedRoutes()
  })

  describe('GET', () => {
    it('should render the confirmation page', async () => {
      await cancelConfirmedRoutes.GET(req as Request, res as Response)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/booking-cancelled', {
        date: '2024-09-09',
      })
    })
  })
})
