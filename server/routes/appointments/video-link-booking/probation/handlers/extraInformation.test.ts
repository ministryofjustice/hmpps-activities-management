import { Request, Response } from 'express'
import ExtraInformationRoutes from './extraInformation'
import ProbationBookingService from '../../../../../services/probationBookingService'

jest.mock('../../../../../services/probationBookingService')

describe('ExtraInformationRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let probationBookingService: jest.Mocked<ProbationBookingService>
  let extraInformationRoutes: ExtraInformationRoutes

  beforeEach(() => {
    req = {
      session: {
        bookAProbationMeetingJourney: {},
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
    probationBookingService = new ProbationBookingService(null) as jest.Mocked<ProbationBookingService>
    extraInformationRoutes = new ExtraInformationRoutes(probationBookingService)
  })

  describe('GET', () => {
    it('renders extra information view', async () => {
      await extraInformationRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/probation/extra-information')
    })
  })

  describe('POST', () => {
    it('redirects with success message when mode is amend', async () => {
      req.body.comments = 'Some comments'
      req.params.mode = 'amend'
      req.session.bookAProbationMeetingJourney.bookingId = 1

      await extraInformationRoutes.POST(req as Request, res as Response)

      expect(probationBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookAProbationMeetingJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/probation/1',
        "You've changed the extra information for this probation meeting",
      )
    })

    it('redirects to check-answers when mode is create', async () => {
      req.body.comments = 'Some comments'
      req.params.mode = 'create'

      await extraInformationRoutes.POST(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })
})
