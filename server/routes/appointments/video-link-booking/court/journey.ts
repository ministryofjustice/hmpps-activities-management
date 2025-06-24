import { AppointmentPrisonerDetails } from '../../create-and-edit/appointmentPrisonerDetails'

export type BookACourtHearingJourney = {
  bookingId?: number
  appointmentIds?: number[]
  bookingStatus?: string
  prisoners?: AppointmentPrisonerDetails[]
  prisoner?: AppointmentPrisonerDetails
  prisonCode?: string
  courtCode?: string
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
  cvpRequired?: boolean
  videoLinkUrl?: string
  notesForStaff?: string
  notesForPrisoners?: string
  hmctsNumber?: string
  guestPinRequired?: boolean
  guestPin?: string
}
