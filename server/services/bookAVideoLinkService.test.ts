import sinon from 'sinon'
import { when } from 'jest-when'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import BookAVideoLinkService from './bookAVideoLinkService'
import { Location, ReferenceCode, VideoLinkBooking } from '../@types/bookAVideoLinkApi/types'
import { ServiceUser } from '../@types/express'
import { BookAVideoLinkJourney } from '../routes/appointments/video-link-booking/journey'

jest.mock('../data/bookAVideoLinkApiClient')

describe('Book A Video link service', () => {
  let bookAVideoLinkClient: jest.Mocked<BookAVideoLinkApiClient>
  let bookAVideoLinkService: BookAVideoLinkService

  const user = { activeCaseLoadId: 'MDI', username: 'USER1', displayName: 'John Smith' } as ServiceUser

  beforeEach(() => {
    bookAVideoLinkClient = new BookAVideoLinkApiClient() as jest.Mocked<BookAVideoLinkApiClient>
    bookAVideoLinkService = new BookAVideoLinkService(bookAVideoLinkClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getVideoLinkBookingById', () => {
    it('should get the video link booking by ID', async () => {
      const expectedResult = { videoLinkBookingId: 1 } as VideoLinkBooking

      when(bookAVideoLinkClient.getVideoLinkBookingById).mockResolvedValue(expectedResult)

      const actualResult = await bookAVideoLinkService.getVideoLinkBookingById(1, user)

      expect(actualResult).toEqual(expectedResult)
      expect(bookAVideoLinkClient.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
    })
  })

  describe('matchAppointmentToVideoLinkBooking', () => {
    it('should get the video link booking by ID', async () => {
      const expectedResult = { videoLinkBookingId: 1 } as VideoLinkBooking

      when(bookAVideoLinkClient.matchAppointmentToVideoLinkBooking).mockResolvedValue(expectedResult)

      const prisonerNumber = 'ABC123'
      const locationKey = 'locationKey'
      const date = '2024-02-20'
      const startTime = '14:00'
      const endTime = '15:00'

      const actualResult = await bookAVideoLinkService.matchAppointmentToVideoLinkBooking(
        prisonerNumber,
        locationKey,
        date,
        startTime,
        endTime,
        user,
      )

      expect(actualResult).toEqual(expectedResult)
      expect(bookAVideoLinkClient.matchAppointmentToVideoLinkBooking).toHaveBeenCalledWith(
        {
          prisonerNumber,
          locationKey,
          date,
          startTime,
          endTime,
        },
        user,
      )
    })
  })

  describe('getAppointmentLocations', () => {
    it('should get the list of video conferencing locations categories from book a video link API', async () => {
      const expectedResult = [{ key: 'key', description: 'description' }] as Location[]

      when(bookAVideoLinkClient.getAppointmentLocations).mockResolvedValue(expectedResult)

      const actualResult = await bookAVideoLinkService.getAppointmentLocations('MDI', user)

      expect(actualResult).toEqual(expectedResult)
      expect(bookAVideoLinkClient.getAppointmentLocations).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('bookingIsAmendable', () => {
    let clock: sinon.SinonFakeTimers

    afterEach(() => {
      if (clock) {
        clock.restore()
      }
    })

    it('returns false if booking status is "CANCELLED"', () => {
      clock = sinon.useFakeTimers(new Date('2024-06-25T12:00:00Z').getTime())

      const dateOfBooking = new Date('2024-06-26')
      const timeOfBooking = new Date('2024-06-26T14:00:00Z')
      const bookingStatus = 'CANCELLED'

      expect(bookAVideoLinkService.bookingIsAmendable(dateOfBooking, timeOfBooking, bookingStatus)).toBe(false)
    })

    it('returns false if booking is in the past', () => {
      clock = sinon.useFakeTimers(new Date('2024-06-26T15:00:00Z').getTime())

      const dateOfBooking = new Date('2024-06-26')
      const timeOfBooking = new Date('2024-06-26T14:00:00Z')
      const bookingStatus = 'ACTIVE'

      expect(bookAVideoLinkService.bookingIsAmendable(dateOfBooking, timeOfBooking, bookingStatus)).toBe(false)
    })

    it('returns true if booking is in the future', () => {
      clock = sinon.useFakeTimers(new Date('2024-06-26T13:00:00Z').getTime())

      const dateOfBooking = new Date('2024-06-26')
      const timeOfBooking = new Date('2024-06-26T14:00:00Z')
      const bookingStatus = 'ACTIVE'

      expect(bookAVideoLinkService.bookingIsAmendable(dateOfBooking, timeOfBooking, bookingStatus)).toBe(true)
    })
  })

  describe('getAllEnabledCourts', () => {
    it('should call getAllEnabledCourts on the api client', async () => {
      bookAVideoLinkClient.getAllEnabledCourts.mockResolvedValue([])

      const result = await bookAVideoLinkService.getAllEnabledCourts(user)

      expect(bookAVideoLinkClient.getAllEnabledCourts).toHaveBeenCalledWith(user)
      expect(result).toEqual([])
    })
  })

  describe('getCourtHearingTypes', () => {
    it('should call getReferenceCodesForGroup on the api client', async () => {
      const expectedResult = [{ code: 'TYPE1', description: 'Type 1' }] as ReferenceCode[]
      bookAVideoLinkClient.getReferenceCodesForGroup.mockResolvedValue(expectedResult)

      const result = await bookAVideoLinkService.getCourtHearingTypes(user)

      expect(bookAVideoLinkClient.getReferenceCodesForGroup).toHaveBeenCalledWith('COURT_HEARING_TYPE', user)
      expect(result).toEqual(expectedResult)
    })
  })

  describe('getProbationMeetingTypes', () => {
    it('should call getReferenceCodesForGroup on the api client', async () => {
      const expectedResult = [{ code: 'TYPE1', description: 'Type 1' }] as ReferenceCode[]
      bookAVideoLinkClient.getReferenceCodesForGroup.mockResolvedValue(expectedResult)

      const result = await bookAVideoLinkService.getProbationMeetingTypes(user)

      expect(bookAVideoLinkClient.getReferenceCodesForGroup).toHaveBeenCalledWith('PROBATION_MEETING_TYPE', user)
      expect(result).toEqual(expectedResult)
    })
  })

  describe('createVideoLinkBooking', () => {
    it('Posts a request to create a court hearing booking only', async () => {
      bookAVideoLinkClient.createVideoLinkBooking.mockResolvedValue(1)

      const journey = {
        type: 'COURT',
        prisoner: {
          prisonCode: 'MDI',
          number: 'ABC123',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        agencyCode: 'COURT_HOUSE',
        hearingTypeCode: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      } as BookAVideoLinkJourney

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
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      }

      const result = await bookAVideoLinkService.createVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.createVideoLinkBooking).toHaveBeenCalledWith(expectedBody, user)
      expect(result).toEqual(1)
    })

    it('Posts a request to create a court hearing booking with a pre/post meeting', async () => {
      const journey = {
        type: 'COURT',
        prisoner: {
          prisonCode: 'MDI',
          number: 'ABC123',
        },
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
        agencyCode: 'COURT_HOUSE',
        hearingTypeCode: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      } as BookAVideoLinkJourney

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
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      }

      await bookAVideoLinkService.createVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.createVideoLinkBooking).toHaveBeenCalledWith(expectedBody, user)
    })
  })
})
