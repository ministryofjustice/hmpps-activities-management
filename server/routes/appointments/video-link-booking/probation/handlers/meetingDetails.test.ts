import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import { ProbationTeam, ReferenceCode } from '../../../../../@types/bookAVideoLinkApi/types'
import ProbationBookingService from '../../../../../services/probationBookingService'
import MeetingDetailsRoutes from './meetingDetails'

jest.mock('../../../../../services/bookAVideoLinkService')
jest.mock('../../../../../services/probationBookingService')

describe('MeetingDetailsRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let probationBookingService: jest.Mocked<ProbationBookingService>
  let meetingDetailsRoutes: MeetingDetailsRoutes

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
      redirectOrReturn: jest.fn(),
    } as unknown as Response
    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    probationBookingService = new ProbationBookingService(null) as jest.Mocked<ProbationBookingService>
    meetingDetailsRoutes = new MeetingDetailsRoutes(bookAVideoLinkService, probationBookingService)
  })

  describe('GET', () => {
    it('renders meeting details view with probation teams and hearing types', async () => {
      const meetingTypes = [{ code: 'TYPE1', description: 'Type 1' }] as ReferenceCode[]
      const probationTeams = [{ code: 'TEAM1', description: 'Team 1' }] as ProbationTeam[]

      bookAVideoLinkService.getAllProbationTeams.mockResolvedValue(probationTeams)
      bookAVideoLinkService.getProbationMeetingTypes.mockResolvedValue(meetingTypes)

      await meetingDetailsRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/probation/meeting-details', {
        probationTeams,
        meetingTypes,
      })
    })
  })

  describe('POST', () => {
    it('redirects with success message when mode is amend', async () => {
      req.body.probationTeamCode = 'TEAM1'
      req.body.meetingTypeCode = 'TYPE1'
      req.params.mode = 'amend'
      req.session.bookAProbationMeetingJourney.bookingId = 1

      await meetingDetailsRoutes.POST(req as Request, res as Response)

      expect(probationBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookAProbationMeetingJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/probation/1',
        "You've changed the meeting type for this probation meeting",
      )
    })

    it('redirects to date and time when mode is create', async () => {
      req.body.meetingTypeCode = 'TYPE1'
      req.params.mode = 'create'

      await meetingDetailsRoutes.POST(req as Request, res as Response)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('date-and-time')
    })
  })
})
