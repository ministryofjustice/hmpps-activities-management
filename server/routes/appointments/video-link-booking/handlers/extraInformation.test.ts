import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import ExtraInformationRoutes from './extraInformation'

jest.mock('../../../../services/bookAVideoLinkService')

describe('ExtraInformationRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let extraInformationRoutes: ExtraInformationRoutes

  beforeEach(() => {
    req = {
      session: {
        bookAVideoLinkJourney: { type: 'COURT' },
      },
      body: {},
      params: {},
    } as unknown as Request
    res = {
      locals: { user: {} },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response
    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    extraInformationRoutes = new ExtraInformationRoutes(bookAVideoLinkService)
  })

  describe('GET', () => {
    it('renders extra information view', async () => {
      await extraInformationRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/extra-information')
    })
  })

  describe('POST', () => {
    it('redirects with success message when mode is amend', async () => {
      req.body.comments = 'Some comments'
      req.params.mode = 'amend'
      req.session.bookAVideoLinkJourney.bookingId = 1

      await extraInformationRoutes.POST(req as Request, res as Response)

      expect(bookAVideoLinkService.amendVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookAVideoLinkJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/1',
        "You've changed the extra information for this court hearing",
      )
    })

    it('redirects with success message when mode is amend for probation booking', async () => {
      req.session.bookAVideoLinkJourney.type = 'PROBATION'
      req.body.comments = 'Some comments'
      req.params.mode = 'amend'
      req.session.bookAVideoLinkJourney.bookingId = 1

      await extraInformationRoutes.POST(req as Request, res as Response)

      expect(bookAVideoLinkService.amendVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookAVideoLinkJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/1',
        "You've changed the extra information for this probation meeting",
      )
    })

    it('redirects to check-answers when mode is not amend', async () => {
      req.body.comments = 'Some comments'
      req.params.mode = 'create'

      await extraInformationRoutes.POST(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })
})
