import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import HearingDetailsRoutes from './hearingDetails'
import { Court, ReferenceCode } from '../../../../@types/bookAVideoLinkApi/types'

jest.mock('../../../../services/bookAVideoLinkService')

describe('HearingDetailsRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let hearingDetailsRoutes: HearingDetailsRoutes

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
      redirectOrReturn: jest.fn(),
    } as unknown as Response
    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    hearingDetailsRoutes = new HearingDetailsRoutes(bookAVideoLinkService)
  })

  describe('GET', () => {
    it('renders hearing details view with agencies and hearing types', async () => {
      const agencies = [{ code: 'COURT1', description: 'Court 1' }] as Court[]
      const hearingTypes = [{ code: 'TYPE1', description: 'Type 1' }] as ReferenceCode[]
      bookAVideoLinkService.getAllCourts.mockResolvedValue(agencies)
      bookAVideoLinkService.getCourtHearingTypes.mockResolvedValue(hearingTypes)

      await hearingDetailsRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/hearing-details', {
        agencies,
        hearingTypes,
      })
      expect(bookAVideoLinkService.getProbationMeetingTypes).not.toHaveBeenCalled()
    })

    it('renders hearing details view with agencies and meeting types when booking is PROBATION type', async () => {
      req.session.bookAVideoLinkJourney.type = 'PROBATION'

      const agencies = [{ code: 'COURT1', description: 'Court 1' }] as Court[]
      const hearingTypes = [{ code: 'TYPE1', description: 'Type 1' }] as ReferenceCode[]
      bookAVideoLinkService.getAllCourts.mockResolvedValue(agencies)
      bookAVideoLinkService.getProbationMeetingTypes.mockResolvedValue(hearingTypes)

      await hearingDetailsRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/hearing-details', {
        agencies,
        hearingTypes,
      })
      expect(bookAVideoLinkService.getCourtHearingTypes).not.toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    it('redirects with success message when mode is amend', async () => {
      req.body.agencyCode = 'COURT1'
      req.body.hearingTypeCode = 'TYPE1'
      req.params.mode = 'amend'
      req.session.bookAVideoLinkJourney.bookingId = 1

      await hearingDetailsRoutes.POST(req as Request, res as Response)

      expect(bookAVideoLinkService.amendVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookAVideoLinkJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/1',
        "You've changed the hearing type for this court hearing",
      )
    })

    it('redirects with success message when mode is amend for probation bookings', async () => {
      req.body.agencyCode = 'COURT1'
      req.body.hearingTypeCode = 'TYPE1'
      req.params.mode = 'amend'
      req.session.bookAVideoLinkJourney.type = 'PROBATION'
      req.session.bookAVideoLinkJourney.bookingId = 1

      await hearingDetailsRoutes.POST(req as Request, res as Response)

      expect(bookAVideoLinkService.amendVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookAVideoLinkJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/1',
        "You've changed the meeting type for this probation meeting",
      )
    })

    it('redirects to location when mode is not amend', async () => {
      req.body.agencyCode = 'COURT1'
      req.body.hearingTypeCode = 'TYPE1'
      req.params.mode = 'create'

      await hearingDetailsRoutes.POST(req as Request, res as Response)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('location')
    })
  })
})
