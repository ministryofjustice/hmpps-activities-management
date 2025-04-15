import { AppointmentPrisonerDetails } from '../../create-and-edit/appointmentPrisonerDetails'

export type BookAProbationMeetingJourney = {
  bookingId?: number
  appointmentId?: number
  bookingStatus?: string
  prisoners?: AppointmentPrisonerDetails[]
  prisoner?: AppointmentPrisonerDetails
  prisonCode?: string
  probationTeamCode?: string
  meetingTypeCode?: string
  officerDetailsNotKnown?: boolean
  officer?: {
    fullName: string
    email: string
    telephone?: string
  }
  date?: string
  startTime?: string
  endTime?: string
  locationCode?: string
  comments?: string
}
