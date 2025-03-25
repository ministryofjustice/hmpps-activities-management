import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import BookAVideoLinkApiClient from '../../../../../data/bookAVideoLinkApiClient'
import CheckBookingRoutes from './checkBooking'
import { Location, ReferenceCode } from '../../../../../@types/bookAVideoLinkApi/types'
import CourtBookingService from '../../../../../services/courtBookingService'

jest.mock('../../../../../services/bookAVideoLinkService')
jest.mock('../../../../../services/courtBookingService')
jest.mock('../../../../../data/bookAVideoLinkApiClient')

describe('CheckBookingRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let courtBookingService: jest.Mocked<CourtBookingService>
  let checkBookingRoutes: CheckBookingRoutes
  let bookAVideoLinkApiClient: jest.Mocked<BookAVideoLinkApiClient>

  beforeEach(() => {
    req = {
      session: {
        bookACourtHearingJourney: {
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
    courtBookingService = new CourtBookingService(bookAVideoLinkApiClient) as jest.Mocked<CourtBookingService>
    checkBookingRoutes = new CheckBookingRoutes(bookAVideoLinkService, courtBookingService)
  })

  describe('GET', () => {
    it('should render the check booking page with rooms, courts, and hearing types', async () => {
      bookAVideoLinkService.getAppointmentLocations.mockResolvedValue([
        { key: 'Room1', description: 'Room 1', enabled: true },
        { key: 'Room2', description: 'Room 2', enabled: true },
      ] as Location[])
      bookAVideoLinkService.getAllCourts.mockResolvedValue([
        { courtId: 1, code: 'Court1', description: 'Court 1', enabled: true },
        { courtId: 2, code: 'Court2', description: 'Court 2', enabled: true },
      ])
      bookAVideoLinkService.getCourtHearingTypes.mockResolvedValue([
        { referenceCodeId: 1, groupCode: 'Group1', code: 'HearingType1', description: 'Hearing Type 1' },
        { referenceCodeId: 2, groupCode: 'Group2', code: 'HearingType2', description: 'Hearing Type 2' },
      ] as ReferenceCode[])

      await checkBookingRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/court/check-booking', {
        rooms: [
          { key: 'Room1', description: 'Room 1', enabled: true },
          { key: 'Room2', description: 'Room 2', enabled: true },
        ],
        courts: [
          { courtId: 1, code: 'Court1', description: 'Court 1', enabled: true },
          { courtId: 2, code: 'Court2', description: 'Court 2', enabled: true },
        ],
        hearingTypes: [
          { referenceCodeId: 1, groupCode: 'Group1', code: 'HearingType1', description: 'Hearing Type 1' },
          { referenceCodeId: 2, groupCode: 'Group2', code: 'HearingType2', description: 'Hearing Type 2' },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should create a video link booking and redirect to confirmation page', async () => {
      courtBookingService.createVideoLinkBooking.mockResolvedValue(123)

      await checkBookingRoutes.POST(req as Request, res as Response)

      expect(courtBookingService.createVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookACourtHearingJourney,
        res.locals.user,
      )
      expect(res.redirect).toHaveBeenCalledWith('confirmation/123')
    })
  })
})
