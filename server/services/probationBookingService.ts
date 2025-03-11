import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { ServiceUser } from '../@types/express'
import { BookAProbationMeetingJourney } from '../routes/appointments/video-link-booking/probation/journey'

export default class ProbationBookingService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public cancelVideoLinkBooking(journey: BookAProbationMeetingJourney, user: ServiceUser) {
    return this.bookAVideoLinkApiClient.cancelVideoLinkBooking(journey.bookingId, user)
  }
}
