import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { ServiceUser } from '../@types/express'
import { BookAProbationMeetingJourney } from '../routes/appointments/video-link-booking/probation/journey'
import { AmendVideoBookingRequest, CreateVideoBookingRequest } from '../@types/bookAVideoLinkApi/types'
import { formatDate, parseISODate } from '../utils/utils'

type VideoBookingRequest = CreateVideoBookingRequest | AmendVideoBookingRequest

export default class ProbationBookingService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public createVideoLinkBooking(journey: BookAProbationMeetingJourney, user: ServiceUser) {
    const request = this.buildBookingRequest<CreateVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.createVideoLinkBooking(request, user)
  }

  public amendVideoLinkBooking(journey: BookAProbationMeetingJourney, user: ServiceUser) {
    const request = this.buildBookingRequest<AmendVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.amendVideoLinkBooking(journey.bookingId, request, user)
  }

  public cancelVideoLinkBooking(journey: BookAProbationMeetingJourney, user: ServiceUser) {
    return this.bookAVideoLinkApiClient.cancelVideoLinkBooking(journey.bookingId, user)
  }

  private buildBookingRequest<T extends VideoBookingRequest>(journey: BookAProbationMeetingJourney): T {
    return {
      bookingType: 'PROBATION',
      prisoners: [
        {
          prisonCode: journey.prisoner.prisonCode,
          prisonerNumber: journey.prisoner.number,
          appointments: this.mapSessionToAppointment(journey),
        },
      ],
      probationTeamCode: journey.probationTeamCode,
      probationMeetingType: journey.meetingTypeCode,
      additionalBookingDetails: journey.officer
        ? {
            contactName: journey.officer.fullName,
            contactEmail: journey.officer.email,
            contactNumber: journey.officer.telephone,
          }
        : undefined,
      comments: journey.comments,
    } as T
  }

  private mapSessionToAppointment = (journey: BookAProbationMeetingJourney) => [
    {
      type: 'VLB_PROBATION',
      locationKey: journey.locationCode,
      date: formatDate(parseISODate(journey.date), 'yyyy-MM-dd'),
      startTime: formatDate(parseISODate(journey.startTime), 'HH:mm'),
      endTime: formatDate(parseISODate(journey.endTime), 'HH:mm'),
    },
  ]
}
