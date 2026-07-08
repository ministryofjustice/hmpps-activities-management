import { AppointmentPrisonerDetails } from '../../create-and-edit/appointmentPrisonerDetails'

export type BookAProbationMeetingJourney = {
  bookingId?: number
  appointmentId?: number
  bookingStatus?: string
  prisoners?: AppointmentPrisonerDetails[]
  prisoner?: AppointmentPrisonerDetails
  prisonCode?: string
  probationTeamRequired?: boolean
  probationTeamCode?: string
  meetingTypeCode?: string
  probationOfficerDetailsKnown?: boolean
  officer?: {
    fullName: string
    email: string
    telephone?: string
  }
  date?: string
  startTime?: string
  endTime?: string
  locationId?: string
  notesForStaff?: string
  notesForPrisoners?: string
}
