import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { ServiceUser } from '../@types/express'
import { BookAProbationMeetingJourney } from '../routes/appointments/video-link-booking/probation/journey'
import ProbationBookingService from './probationBookingService'

jest.mock('../data/bookAVideoLinkApiClient')

describe('Probation booking service', () => {
  let bookAVideoLinkClient: jest.Mocked<BookAVideoLinkApiClient>
  let probationBookingService: ProbationBookingService

  const user = { activeCaseLoadId: 'MDI', username: 'USER1', displayName: 'John Smith' } as ServiceUser

  const journey = {
    prisoner: {
      prisonCode: 'MDI',
      number: 'ABC123',
    },
    date: '2022-03-20T00:00:00Z',
    locationCode: 'LOCATION',
    startTime: '1970-01-01T13:30:00Z',
    endTime: '1970-01-01T14:30:00Z',
    probationTeamCode: 'BLACKPP',
    meetingTypeCode: 'PSR',
    comments: 'comments',
  } as BookAProbationMeetingJourney

  beforeEach(() => {
    bookAVideoLinkClient = new BookAVideoLinkApiClient() as jest.Mocked<BookAVideoLinkApiClient>
    probationBookingService = new ProbationBookingService(bookAVideoLinkClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('createVideoLinkBooking', () => {
    it('Posts a request to create a probation hearing booking', async () => {
      bookAVideoLinkClient.createVideoLinkBooking.mockResolvedValue(1)

      const expectedBody = {
        bookingType: 'PROBATION',
        prisoners: [
          {
            prisonCode: 'MDI',
            prisonerNumber: 'ABC123',
            appointments: [
              {
                type: 'VLB_PROBATION',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
            ],
          },
        ],
        probationTeamCode: 'BLACKPP',
        probationMeetingType: 'PSR',
        comments: 'comments',
      }

      const result = await probationBookingService.createVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.createVideoLinkBooking).toHaveBeenCalledWith(expectedBody, user)
      expect(result).toEqual(1)
    })
  })

  describe('amendVideoLinkBooking', () => {
    it('Puts a request to amend a probation hearing booking', async () => {
      bookAVideoLinkClient.amendVideoLinkBooking.mockResolvedValue(1)

      const expectedBody = {
        bookingType: 'PROBATION',
        prisoners: [
          {
            prisonCode: 'MDI',
            prisonerNumber: 'ABC123',
            appointments: [
              {
                type: 'VLB_PROBATION',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
            ],
          },
        ],
        probationTeamCode: 'BLACKPP',
        probationMeetingType: 'PSR',
        comments: 'comments',
      }

      const result = await probationBookingService.amendVideoLinkBooking({ ...journey, bookingId: 1 }, user)

      expect(bookAVideoLinkClient.amendVideoLinkBooking).toHaveBeenCalledWith(1, expectedBody, user)
      expect(result).toEqual(1)
    })
  })

  describe('cancelVideoLinkBooking', () => {
    it('calls the cancel booking endpoint', async () => {
      await probationBookingService.cancelVideoLinkBooking({ bookingId: 1 }, user)
      expect(bookAVideoLinkClient.cancelVideoLinkBooking).toHaveBeenCalledWith(1, user)
    })
  })
})
