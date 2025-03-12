import { AppointmentPrisonerDetails } from '../../create-and-edit/appointmentPrisonerDetails'

export type BookACourtHearingJourney = {
  bookingId?: number
  appointmentIds?: number[]
  bookingStatus?: string
  type?: string // TODO: Remove this property when the feature toggle BVLS_MASTERED_VLPM_FEATURE_TOGGLE_ENABLED is removed
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
