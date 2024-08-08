import { AppointmentPrisonerDetails } from '../create-and-edit/appointmentPrisonerDetails'

export type BookAVideoLinkJourney = {
  bookingId?: number
  bookingStatus?: string
  type?: string
  prisoners?: AppointmentPrisonerDetails[]
  prisoner?: AppointmentPrisonerDetails
  agencyCode?: string
  hearingTypeCode?: string
  date?: string
  startTime?: string
  endTime?: string
  preHearingStartTime?: string
  preHearingEndTime?: string
  postHearingStartTime?: string
  postHearingEndTime?: string
  locationCode?: string
  preLocationCode?: string
  postLocationCode?: string
  comments?: string
  videoLinkUrl?: string
}
