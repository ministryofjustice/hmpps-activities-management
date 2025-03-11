import { AppointmentPrisonerDetails } from '../../create-and-edit/appointmentPrisonerDetails'

export type BookAProbationMeetingJourney = {
  bookingId?: number
  appointmentId?: number
  bookingStatus?: string
  prisoners?: AppointmentPrisonerDetails[]
  prisoner?: AppointmentPrisonerDetails
  probationTeamCode?: string
  meetingTypeCode?: string
  date?: string
  startTime?: string
  endTime?: string
  locationCode?: string
  comments?: string
}
