import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import BookAVideoLinkApiClient from '../../../../../data/bookAVideoLinkApiClient'
import CheckBookingRoutes from './checkBooking'
import { Location, ReferenceCode } from '../../../../../@types/bookAVideoLinkApi/types'
import ProbationBookingService from '../../../../../services/probationBookingService'

jest.mock('../../../../../services/bookAVideoLinkService')
jest.mock('../../../../../services/probationBookingService')
jest.mock('../../../../../data/bookAVideoLinkApiClient')

describe('CheckBookingRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let probationBookingService: jest.Mocked<ProbationBookingService>
  let checkBookingRoutes: CheckBookingRoutes
  let bookAVideoLinkApiClient: jest.Mocked<BookAVideoLinkApiClient>

  beforeEach(() => {
    req = {
      session: {
        bookAProbationMeetingJourney: {
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
    probationBookingService = new ProbationBookingService(
      bookAVideoLinkApiClient,
    ) as jest.Mocked<ProbationBookingService>
    checkBookingRoutes = new CheckBookingRoutes(bookAVideoLinkService, probationBookingService)
  })

  describe('GET', () => {
    it('should render the check booking page with rooms, probation teams, and meeting types', async () => {
      bookAVideoLinkService.getAppointmentLocations.mockResolvedValue([
        { key: 'Room1', description: 'Room 1', enabled: true },
        { key: 'Room2', description: 'Room 2', enabled: true },
      ] as Location[])
      bookAVideoLinkService.getAllProbationTeams.mockResolvedValue([
        { probationTeamId: 1, code: 'Team1', description: 'Team 1', enabled: true },
        { probationTeamId: 2, code: 'Team2', description: 'Team 2', enabled: true },
      ])
      bookAVideoLinkService.getProbationMeetingTypes.mockResolvedValue([
        { referenceCodeId: 1, groupCode: 'Group1', code: 'MeetingType1', description: 'Meeting Type 1' },
        { referenceCodeId: 2, groupCode: 'Group2', code: 'MeetingType2', description: 'Meeting Type 2' },
      ] as ReferenceCode[])

      await checkBookingRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/probation/check-booking', {
        rooms: [
          { key: 'Room1', description: 'Room 1', enabled: true },
          { key: 'Room2', description: 'Room 2', enabled: true },
        ],
        probationTeams: [
          { probationTeamId: 1, code: 'Team1', description: 'Team 1', enabled: true },
          { probationTeamId: 2, code: 'Team2', description: 'Team 2', enabled: true },
        ],
        meetingTypes: [
          { referenceCodeId: 1, groupCode: 'Group1', code: 'MeetingType1', description: 'Meeting Type 1' },
          { referenceCodeId: 2, groupCode: 'Group2', code: 'MeetingType2', description: 'Meeting Type 2' },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should create a video link booking and redirect to confirmation page', async () => {
      probationBookingService.createVideoLinkBooking.mockResolvedValue(123)

      await checkBookingRoutes.POST(req as Request, res as Response)

      expect(probationBookingService.createVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookAProbationMeetingJourney,
        res.locals.user,
      )
      expect(res.redirect).toHaveBeenCalledWith('confirmation/123')
    })
  })
})
