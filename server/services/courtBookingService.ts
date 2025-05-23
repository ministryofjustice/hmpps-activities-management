import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { ServiceUser } from '../@types/express'
import { AmendVideoBookingRequest, CreateVideoBookingRequest } from '../@types/bookAVideoLinkApi/types'
import { formatDate, parseISODate } from '../utils/utils'
import { BookACourtHearingJourney } from '../routes/appointments/video-link-booking/court/journey'

type VideoBookingRequest = CreateVideoBookingRequest | AmendVideoBookingRequest

export default class CourtBookingService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public createVideoLinkBooking(journey: BookACourtHearingJourney, user: ServiceUser) {
    const request = this.buildBookingRequest<CreateVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.createVideoLinkBooking(request, user)
  }

  public amendVideoLinkBooking(journey: BookACourtHearingJourney, user: ServiceUser) {
    const request = this.buildBookingRequest<AmendVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.amendVideoLinkBooking(journey.bookingId, request, user)
  }

  public cancelVideoLinkBooking(journey: BookACourtHearingJourney, user: ServiceUser) {
    return this.bookAVideoLinkApiClient.cancelVideoLinkBooking(journey.bookingId, user)
  }

  private buildBookingRequest<T extends VideoBookingRequest>(journey: BookACourtHearingJourney): T {
    return {
      bookingType: 'COURT',
      prisoners: [
        {
          prisonCode: journey.prisonCode,
          prisonerNumber: journey.prisoner.number,
          appointments: this.mapSessionToAppointments(journey),
        },
      ],
      courtCode: journey.courtCode,
      courtHearingType: journey.hearingTypeCode,
      comments: journey.comments,
      videoLinkUrl: journey.videoLinkUrl,
      notesForStaff: journey.notesForStaff,
      notesForPrisoners: journey.notesForPrisoners,
    } as T
  }

  private mapSessionToAppointments(journey: BookACourtHearingJourney) {
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
      createAppointment(
        'VLB_COURT_PRE',
        journey.preLocationCode,
        journey.date,
        journey.preHearingStartTime,
        journey.preHearingEndTime,
      ),
      createAppointment('VLB_COURT_MAIN', journey.locationCode, journey.date, journey.startTime, journey.endTime),
      createAppointment(
        'VLB_COURT_POST',
        journey.postLocationCode,
        journey.date,
        journey.postHearingStartTime,
        journey.postHearingEndTime,
      ),
    ].filter(Boolean)
  }
}
