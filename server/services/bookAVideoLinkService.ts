import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { dateAtTime } from '../utils/utils'
import { VideoBookingSearchRequest } from '../@types/bookAVideoLinkApi/types'

export default class BookAVideoLinkService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public getVideoLinkBookingById(id: number) {
    return this.bookAVideoLinkApiClient.getVideoLinkBookingById(id)
  }

  public matchAppointmentToVideoLinkBooking(
    prisonerNumber: string,
    locationKey: string,
    date: string,
    startTime: string,
    endTime: string,
    statusCode: 'ACTIVE' | 'CANCELLED',
  ) {
    const requestBody = {
      prisonerNumber,
      locationKey,
      date,
      startTime,
      endTime,
      statusCode,
    } as VideoBookingSearchRequest
    return this.bookAVideoLinkApiClient.matchAppointmentToVideoLinkBooking(requestBody)
  }

  public async getAppointmentLocations(prisonCode: string) {
    return this.bookAVideoLinkApiClient.getAppointmentLocations(prisonCode)
  }

  public bookingIsAmendable(dateOfBooking: Date, timeOfBooking: Date, bookingStatus: string): boolean {
    const now = new Date()
    const exactTimeOfBooking = dateAtTime(dateOfBooking, timeOfBooking)
    return bookingStatus !== 'CANCELLED' && exactTimeOfBooking > now
  }

  public async getAllCourts() {
    return this.bookAVideoLinkApiClient.getAllCourts()
  }

  public async getAllProbationTeams() {
    return this.bookAVideoLinkApiClient.getAllProbationTeams()
  }

  public getCourtHearingTypes() {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('COURT_HEARING_TYPE')
  }

  public getProbationMeetingTypes() {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('PROBATION_MEETING_TYPE')
  }
}
