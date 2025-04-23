import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import BookAVideoLinkApiClient from '../../../../../data/bookAVideoLinkApiClient'
import ConfirmationRoutes from './confirmation'
import { ProbationTeam, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import PrisonService from '../../../../../services/prisonService'

jest.mock('../../../../../services/bookAVideoLinkService')
jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../data/bookAVideoLinkApiClient')

describe('ConfirmationRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let prisonService: jest.Mocked<PrisonService>
  let confirmationRoutes: ConfirmationRoutes
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
    prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
    confirmationRoutes = new ConfirmationRoutes(bookAVideoLinkService, prisonService)
  })

  describe('GET', () => {
    it('should render the confirmation page with video link booking and probation team details', async () => {
      const vlb = {
        videoLinkBookingId: 1,
        statusCode: 'ACTIVE',
        bookingType: 'PROBATION',
        probationTeamCode: 'Team1',
        prisonAppointments: [
          {
            prisonAppointmentId: 2,
            prisonCode: 'PRISON1',
            prisonerNumber: 'A1234BC',
            appointmentType: 'VLB_PROBATION',
            appointmentDate: '2025-04-22',
            startTime: '10:30',
            endTime: '11:00',
          },
        ],
        createdBy: 'user1',
        amendedBy: 'user2',
        createdAt: '2025-04-22T10:00:00Z',
      } as VideoLinkBooking

      const probationTeam = {
        probationTeamId: 1,
        code: 'Team1',
        description: 'Disabled probation team',
        enabled: false,
      } as ProbationTeam
      bookAVideoLinkService.getVideoLinkBookingById.mockResolvedValue(vlb)
      bookAVideoLinkService.getAllProbationTeams.mockResolvedValue([probationTeam])

      const prisoner = {
        prisonerNumber: 'A1234BC',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1980-01-01',
        prisonId: 'PRISON1',
      } as Prisoner
      prisonService.getInmateByPrisonerNumber.mockResolvedValue(prisoner)

      req.params = { vlbId: '1' }

      await confirmationRoutes.GET(req as Request, res as Response)

      expect(bookAVideoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, res.locals.user)
      expect(prisonService.getInmateByPrisonerNumber).toHaveBeenCalledWith('A1234BC', res.locals.user)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/probation/confirmation', {
        vlb,
        probationTeam,
        prisoner,
      })
    })
  })
})
