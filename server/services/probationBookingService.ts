import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { BookAProbationMeetingJourney } from '../routes/appointments/video-link-booking/probation/journey'
import { AmendVideoBookingRequest, CreateVideoBookingRequest } from '../@types/bookAVideoLinkApi/types'
import { formatDate, parseISODate } from '../utils/utils'

type VideoBookingRequest = CreateVideoBookingRequest | AmendVideoBookingRequest

export default class ProbationBookingService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public createVideoLinkBooking(journey: BookAProbationMeetingJourney) {
    const request = this.buildBookingRequest<CreateVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.createVideoLinkBooking(request)
  }

  public amendVideoLinkBooking(journey: BookAProbationMeetingJourney) {
    const request = this.buildBookingRequest<AmendVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.amendVideoLinkBooking(journey.bookingId, request)
  }

  public cancelVideoLinkBooking(journey: BookAProbationMeetingJourney) {
    return this.bookAVideoLinkApiClient.cancelVideoLinkBooking(journey.bookingId)
  }

  private buildBookingRequest<T extends VideoBookingRequest>(journey: BookAProbationMeetingJourney): T {
    return {
      bookingType: 'PROBATION',
      prisoners: [
        {
          prisonCode: journey.prisonCode,
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
      notesForStaff: journey.notesForStaff,
      notesForPrisoners: journey.notesForPrisoners,
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
