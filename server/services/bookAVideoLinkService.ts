import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { ServiceUser } from '../@types/express'
import { dateAtTime, formatDate, parseISODate } from '../utils/utils'
import {
  AmendVideoBookingRequest,
  CreateVideoBookingRequest,
  VideoBookingSearchRequest,
} from '../@types/bookAVideoLinkApi/types'
import { BookAVideoLinkJourney } from '../routes/appointments/video-link-booking/journey'

type VideoBookingRequest = CreateVideoBookingRequest | AmendVideoBookingRequest

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
    user: ServiceUser,
  ) {
    const requestBody = {
      prisonerNumber,
      locationKey,
      date,
      startTime,
      endTime,
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

  public getCourtHearingTypes(user: ServiceUser) {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('COURT_HEARING_TYPE', user)
  }

  public getProbationMeetingTypes(user: ServiceUser) {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('PROBATION_MEETING_TYPE', user)
  }

  public createVideoLinkBooking(journey: BookAVideoLinkJourney, user: ServiceUser) {
    const request = this.buildBookingRequest<CreateVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.createVideoLinkBooking(request, user)
  }

  public amendVideoLinkBooking(journey: BookAVideoLinkJourney, user: ServiceUser) {
    const request = this.buildBookingRequest<AmendVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.amendVideoLinkBooking(journey.bookingId, request, user)
  }

  public cancelVideoLinkBooking(journey: BookAVideoLinkJourney, user: ServiceUser) {
    return this.bookAVideoLinkApiClient.cancelVideoLinkBooking(journey.bookingId, user)
  }

  private buildBookingRequest<T extends VideoBookingRequest>(journey: BookAVideoLinkJourney): T {
    return {
      bookingType: journey.type,
      prisoners: [
        {
          prisonCode: journey.prisoner.prisonCode,
          prisonerNumber: journey.prisoner.number,
          appointments: this.mapSessionToAppointments(journey),
        },
      ],
      courtCode: journey.type === 'COURT' ? journey.agencyCode : undefined,
      courtHearingType: journey.type === 'COURT' ? journey.hearingTypeCode : undefined,
      probationTeamCode: journey.type === 'PROBATION' ? journey.agencyCode : undefined,
      probationMeetingType: journey.type === 'PROBATION' ? journey.hearingTypeCode : undefined,
      comments: journey.comments,
      videoLinkUrl: journey.videoLinkUrl,
    } as T
  }

  private mapSessionToAppointments(journey: BookAVideoLinkJourney) {
    const createAppointment = (type: string, locationCode: string, date: string, startTime: string, endTime: string) =>
      locationCode
        ? {
            type,
            locationKey: locationCode,
            date: formatDate(parseISODate(date), 'yyyy-MM-dd'),
            startTime: formatDate(parseISODate(startTime), 'HH:mm'),
            endTime: formatDate(parseISODate(endTime), 'HH:mm'),
          }
        : undefined

    return [
      journey.type === 'COURT'
        ? createAppointment(
            'VLB_COURT_PRE',
            journey.preLocationCode,
            journey.date,
            journey.preHearingStartTime,
            journey.preHearingEndTime,
          )
        : undefined,
      journey.type === 'COURT'
        ? createAppointment('VLB_COURT_MAIN', journey.locationCode, journey.date, journey.startTime, journey.endTime)
        : undefined,
      journey.type === 'COURT'
        ? createAppointment(
            'VLB_COURT_POST',
            journey.postLocationCode,
            journey.date,
            journey.postHearingStartTime,
            journey.postHearingEndTime,
          )
        : undefined,
      journey.type === 'PROBATION'
        ? createAppointment('VLB_PROBATION', journey.locationCode, journey.date, journey.startTime, journey.endTime)
        : undefined,
    ].filter(Boolean)
  }
}
