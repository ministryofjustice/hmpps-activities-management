import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import CourtBookingService from './courtBookingService'
import { BookACourtHearingJourney } from '../routes/appointments/video-link-booking/court/journey'

jest.mock('../data/bookAVideoLinkApiClient')

describe('Court booking service', () => {
  let bookAVideoLinkClient: jest.Mocked<BookAVideoLinkApiClient>
  let courtBookingService: CourtBookingService
  const mockAuthenticationClient = {
    getToken: jest.fn().mockResolvedValue('test-system-token'),
  } as unknown as jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    bookAVideoLinkClient = new BookAVideoLinkApiClient(mockAuthenticationClient) as jest.Mocked<BookAVideoLinkApiClient>
    courtBookingService = new CourtBookingService(bookAVideoLinkClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('createVideoLinkBooking', () => {
    it('Posts a request to create a court hearing booking only', async () => {
      bookAVideoLinkClient.createVideoLinkBooking.mockResolvedValue(1)

      const journey = {
        prisoner: {
          prisonCode: 'MDI',
          number: 'ABC123',
        },
        prisonCode: 'MDI',
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        courtCode: 'COURT_HOUSE',
        hearingTypeCode: 'APPEAL',
        videoLinkUrl: 'videoLinkUrl',
        notesForStaff: 'notes for staff',
        notesForPrisoners: 'notes for prisoners',
        hmctsNumber: '54321',
        guestPin: 'A9A476',
      } as BookACourtHearingJourney

      const expectedBody = {
        bookingType: 'COURT',
        prisoners: [
          {
            prisonCode: 'MDI',
            prisonerNumber: 'ABC123',
            appointments: [
              {
                type: 'VLB_COURT_MAIN',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
            ],
          },
        ],
        courtCode: 'COURT_HOUSE',
        courtHearingType: 'APPEAL',
        videoLinkUrl: 'videoLinkUrl',
        notesForStaff: 'notes for staff',
        notesForPrisoners: 'notes for prisoners',
        hmctsNumber: '54321',
        guestPin: 'A9A476',
      }

      const result = await courtBookingService.createVideoLinkBooking(journey)

      expect(bookAVideoLinkClient.createVideoLinkBooking).toHaveBeenCalledWith(expectedBody)
      expect(result).toEqual(1)
    })

    it('Posts a request to create a court hearing booking with a pre/post meeting', async () => {
      const journey = {
        prisoner: {
          prisonCode: 'MDI',
          number: 'ABC123',
        },
        prisonCode: 'MDI',
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        preLocationCode: 'PRE_LOCATION',
        preHearingStartTime: '1970-01-01T13:15:00Z',
        preHearingEndTime: '1970-01-01T13:30:00Z',
        postLocationCode: 'POST_LOCATION',
        postHearingStartTime: '1970-01-01T14:30:00Z',
        postHearingEndTime: '1970-01-01T14:45:00Z',
        courtCode: 'COURT_HOUSE',
        hearingTypeCode: 'APPEAL',
        videoLinkUrl: 'videoLinkUrl',
        notesForStaff: 'notes for staff',
        notesForPrisoners: 'notes for prisoners',
      } as BookACourtHearingJourney

      const expectedBody = {
        bookingType: 'COURT',
        prisoners: [
          {
            prisonCode: 'MDI',
            prisonerNumber: 'ABC123',
            appointments: [
              {
                type: 'VLB_COURT_PRE',
                locationKey: 'PRE_LOCATION',
                date: '2022-03-20',
                startTime: '13:15',
                endTime: '13:30',
              },
              {
                type: 'VLB_COURT_MAIN',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
              {
                type: 'VLB_COURT_POST',
                locationKey: 'POST_LOCATION',
                date: '2022-03-20',
                startTime: '14:30',
                endTime: '14:45',
              },
            ],
          },
        ],
        courtCode: 'COURT_HOUSE',
        courtHearingType: 'APPEAL',
        videoLinkUrl: 'videoLinkUrl',
        notesForStaff: 'notes for staff',
        notesForPrisoners: 'notes for prisoners',
      }

      await courtBookingService.createVideoLinkBooking(journey)

      expect(bookAVideoLinkClient.createVideoLinkBooking).toHaveBeenCalledWith(expectedBody)
    })
  })

  describe('amendVideoLinkBooking', () => {
    const journey = {
      prisoner: {
        prisonCode: 'MDI',
        number: 'ABC123',
      },
      date: '2022-03-20T00:00:00Z',
      locationCode: 'LOCATION',
      startTime: '1970-01-01T13:30:00Z',
      endTime: '1970-01-01T14:30:00Z',
      prisonCode: 'MDI',
      courtCode: 'COURT_HOUSE',
      hearingTypeCode: 'APPEAL',
      videoLinkUrl: 'videoLinkUrl',
    } as BookACourtHearingJourney

    it('Puts a request to amend a probation hearing booking', async () => {
      bookAVideoLinkClient.amendVideoLinkBooking.mockResolvedValue(1)

      const expectedBody = {
        bookingType: 'COURT',
        prisoners: [
          {
            prisonCode: 'MDI',
            prisonerNumber: 'ABC123',
            appointments: [
              {
                type: 'VLB_COURT_MAIN',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
            ],
          },
        ],
        courtCode: 'COURT_HOUSE',
        courtHearingType: 'APPEAL',
        videoLinkUrl: 'videoLinkUrl',
      }

      const result = await courtBookingService.amendVideoLinkBooking({ ...journey, bookingId: 1 })

      expect(bookAVideoLinkClient.amendVideoLinkBooking).toHaveBeenCalledWith(1, expectedBody)
      expect(result).toEqual(1)
    })
  })

  describe('cancelVideoLinkBooking', () => {
    it('calls the cancel booking endpoint', async () => {
      await courtBookingService.cancelVideoLinkBooking({ bookingId: 1 })
      expect(bookAVideoLinkClient.cancelVideoLinkBooking).toHaveBeenCalledWith(1)
    })
  })
})
