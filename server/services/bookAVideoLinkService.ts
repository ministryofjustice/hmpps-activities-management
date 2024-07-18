import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { ServiceUser } from '../@types/express'
import { dateAtTime } from '../utils/utils'

export default class BookAVideoLinkService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public getVideoLinkBookingById(id: number, user: ServiceUser) {
    return this.bookAVideoLinkApiClient.getVideoLinkBookingById(id, user)
  }

  public async getAppointmentLocations(prisonCode: string, user: ServiceUser) {
    return this.bookAVideoLinkApiClient.getAppointmentLocations(prisonCode, user)
  }

  public bookingIsAmendable(dateOfBooking: Date, timeOfBooking: Date, bookingStatus: string): boolean {
    const now = new Date()
    const exactTimeOfBooking = dateAtTime(dateOfBooking, timeOfBooking)
    return bookingStatus !== 'CANCELLED' && exactTimeOfBooking > now
  }
}
