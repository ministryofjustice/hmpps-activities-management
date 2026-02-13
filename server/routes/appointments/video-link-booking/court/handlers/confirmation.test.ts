import { Request, Response } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import BookAVideoLinkApiClient from '../../../../../data/bookAVideoLinkApiClient'
import ConfirmationRoutes from './confirmation'
import { Court, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
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
  const mockAuthenticationClient = {
    getToken: jest.fn().mockResolvedValue('test-system-token'),
  } as unknown as jest.Mocked<AuthenticationClient>

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
    bookAVideoLinkApiClient = new BookAVideoLinkApiClient(
      mockAuthenticationClient,
    ) as jest.Mocked<BookAVideoLinkApiClient>
    bookAVideoLinkService = new BookAVideoLinkService(bookAVideoLinkApiClient) as jest.Mocked<BookAVideoLinkService>
    prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
    confirmationRoutes = new ConfirmationRoutes(bookAVideoLinkService, prisonService)
  })

  describe('GET', () => {
    it('should render the confirmation page with video link booking and court details', async () => {
      const vlb = {
        videoLinkBookingId: 1,
        statusCode: 'ACTIVE',
        bookingType: 'COURT',
        courtCode: 'Court1',
        prisonAppointments: [
          {
            prisonAppointmentId: 2,
            prisonCode: 'PRISON1',
            prisonerNumber: 'A1234BC',
            appointmentType: 'VLB_COURT',
            appointmentDate: '2025-04-22',
            startTime: '10:30',
            endTime: '11:00',
          },
        ],
        createdBy: 'user1',
        amendedBy: 'user2',
        createdAt: '2025-04-22T10:00:00Z',
      } as VideoLinkBooking
      const court = { courtId: 1, code: 'Court1', description: 'Disabled Court', enabled: false } as Court
      bookAVideoLinkService.getVideoLinkBookingById.mockResolvedValue(vlb)
      bookAVideoLinkService.getAllCourts.mockResolvedValue([court])

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

      expect(bookAVideoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1)
      expect(prisonService.getInmateByPrisonerNumber).toHaveBeenCalledWith('A1234BC', res.locals.user)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/court/confirmation', {
        vlb,
        court,
        prisoner,
      })
    })
  })
})
