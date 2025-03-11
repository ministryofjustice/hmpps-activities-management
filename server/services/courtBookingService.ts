import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { ServiceUser } from '../@types/express'
import { BookACourtHearingJourney } from '../routes/appointments/video-link-booking/court/journey'

export default class CourtBookingService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public cancelVideoLinkBooking(journey: BookACourtHearingJourney, user: ServiceUser) {
    return this.bookAVideoLinkApiClient.cancelVideoLinkBooking(journey.bookingId, user)
  }
}
