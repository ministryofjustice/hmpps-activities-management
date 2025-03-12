import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import HearingDetailsRoutes from './hearingDetails'
import { Court, ReferenceCode } from '../../../../../@types/bookAVideoLinkApi/types'
import CourtBookingService from '../../../../../services/courtBookingService'

jest.mock('../../../../../services/bookAVideoLinkService')
jest.mock('../../../../../services/courtBookingService')

describe('HearingDetailsRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let courtBookingService: jest.Mocked<CourtBookingService>
  let hearingDetailsRoutes: HearingDetailsRoutes

  beforeEach(() => {
    req = {
      session: {
        bookACourtHearingJourney: {},
      },
      body: {},
      params: {},
    } as unknown as Request
    res = {
      locals: { user: {} },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response
    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    courtBookingService = new CourtBookingService(null) as jest.Mocked<CourtBookingService>
    hearingDetailsRoutes = new HearingDetailsRoutes(bookAVideoLinkService, courtBookingService)
  })

  describe('GET', () => {
    it('renders hearing details view with agencies and hearing types', async () => {
      const agencies = [{ code: 'COURT1', description: 'Court 1' }] as Court[]
      const hearingTypes = [{ code: 'TYPE1', description: 'Type 1' }] as ReferenceCode[]
      bookAVideoLinkService.getAllCourts.mockResolvedValue(agencies)
      bookAVideoLinkService.getCourtHearingTypes.mockResolvedValue(hearingTypes)

      await hearingDetailsRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/court/hearing-details', {
        agencies,
        hearingTypes,
      })
    })
  })

  describe('POST', () => {
    it('redirects with success message when mode is amend', async () => {
      req.body.courtCode = 'COURT1'
      req.body.hearingTypeCode = 'TYPE1'
      req.params.mode = 'amend'
      req.session.bookACourtHearingJourney.bookingId = 1

      await hearingDetailsRoutes.POST(req as Request, res as Response)

      expect(courtBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookACourtHearingJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/court/1',
        "You've changed the hearing type for this court hearing",
      )
    })

    it('redirects to location when mode is not amend', async () => {
      req.body.courtCode = 'COURT1'
      req.body.hearingTypeCode = 'TYPE1'
      req.params.mode = 'create'

      await hearingDetailsRoutes.POST(req as Request, res as Response)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('location')
    })
  })
})
