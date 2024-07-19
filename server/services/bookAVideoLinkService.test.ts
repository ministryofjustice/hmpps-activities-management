import sinon from 'sinon'
import { when } from 'jest-when'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import BookAVideoLinkService from './bookAVideoLinkService'
import { Location, VideoLinkBooking } from '../@types/bookAVideoLinkApi/types'
import { ServiceUser } from '../@types/express'

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
})
