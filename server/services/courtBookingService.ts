import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { AmendVideoBookingRequest, CreateVideoBookingRequest } from '../@types/bookAVideoLinkApi/types'
import { formatDate, parseISODate } from '../utils/utils'
import { BookACourtHearingJourney } from '../routes/appointments/video-link-booking/court/journey'

type VideoBookingRequest = CreateVideoBookingRequest | AmendVideoBookingRequest

export default class CourtBookingService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public createVideoLinkBooking(journey: BookACourtHearingJourney) {
    const request = this.buildBookingRequest<CreateVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.createVideoLinkBooking(request)
  }

  public amendVideoLinkBooking(journey: BookACourtHearingJourney) {
    const request = this.buildBookingRequest<AmendVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.amendVideoLinkBooking(journey.bookingId, request)
  }

  public cancelVideoLinkBooking(journey: BookACourtHearingJourney) {
    return this.bookAVideoLinkApiClient.cancelVideoLinkBooking(journey.bookingId)
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
      videoLinkUrl: journey.videoLinkUrl,
      notesForStaff: journey.notesForStaff,
      notesForPrisoners: journey.notesForPrisoners,
      hmctsNumber: journey.hmctsNumber,
      guestPin: journey.guestPin,
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
