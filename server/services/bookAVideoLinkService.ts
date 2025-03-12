import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { ServiceUser } from '../@types/express'
import { dateAtTime } from '../utils/utils'
import { VideoBookingSearchRequest } from '../@types/bookAVideoLinkApi/types'

export default class BookAVideoLinkService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public getVideoLinkBookingById(id: number, user: ServiceUser) {
    return this.bookAVideoLinkApiClient.getVideoLinkBookingById(id, user)
  }

  public matchAppointmentToVideoLinkBooking(
    prisonerNumber: string,
    locationKey: string,
    date: string,
    startTime: string,
    endTime: string,
    statusCode: 'ACTIVE' | 'CANCELLED',
    user: ServiceUser,
  ) {
    const requestBody = {
      prisonerNumber,
      locationKey,
      date,
      startTime,
      endTime,
      statusCode,
    } as VideoBookingSearchRequest
    return this.bookAVideoLinkApiClient.matchAppointmentToVideoLinkBooking(requestBody, user)
  }

  public async getAppointmentLocations(prisonCode: string, user: ServiceUser) {
    return this.bookAVideoLinkApiClient.getAppointmentLocations(prisonCode, user)
  }

  public bookingIsAmendable(dateOfBooking: Date, timeOfBooking: Date, bookingStatus: string): boolean {
    const now = new Date()
    const exactTimeOfBooking = dateAtTime(dateOfBooking, timeOfBooking)
    return bookingStatus !== 'CANCELLED' && exactTimeOfBooking > now
  }

  public async getAllCourts(user: ServiceUser) {
    return this.bookAVideoLinkApiClient.getAllCourts(user)
  }

  public async getAllProbationTeams(user: ServiceUser) {
    return this.bookAVideoLinkApiClient.getAllProbationTeams(user)
  }

  public getCourtHearingTypes(user: ServiceUser) {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('COURT_HEARING_TYPE', user)
  }

  public getProbationMeetingTypes(user: ServiceUser) {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('PROBATION_MEETING_TYPE', user)
  }
}
