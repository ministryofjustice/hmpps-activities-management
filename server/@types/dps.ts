import { PrisonerScheduleLenient } from './prisonApiImportCustom'

export type NameValueStringPair = {
  name: string
  value: string
}

export type CodeNameStringPair = {
  code: string
  name: string
}

export type EventStatus = {
  scheduled?: boolean
  cancelled?: boolean
  expired?: boolean
  complete?: boolean
  unCheckedStatus?: string
}

export type EventLite = EventStatus & {
  eventId: number
  eventDescription: string
}

export type OffenderData = {
  releaseScheduled: boolean
  courtEvents: EventLite[]
  scheduledTransfers: EventLite[]
  alertFlags: string[]
  category: string
}

export type AttendanceInfo = {
  absentReason?: NameValueStringPair
  absentSubReason?: string
  comments?: string
  attended?: boolean
  paid?: boolean
  locked?: boolean
  other?: boolean
  pay?: boolean
}

export type AttendanceForm = {
  pay?: string
  moreDetail?: string
  paidReason?: string
  paidSubReason?: string
  unpaidReason?: string
  unpaidSubReason?: string
  incentiveWarning?: string
}

export type OffenderActivitiesByLocation = OffenderData & {
  eventsElsewhere: PrisonerScheduleLenient[]
  attendanceInfo: AttendanceInfo
}

export type ActivityByLocation = PrisonerScheduleLenient & OffenderActivitiesByLocation

export type ActivityListTableRow = {
  bookingId: number
  eventId: number
  name: string
  location: string
  prisonNumber: string
  relevantAlerts: string[]
  activity: string
  otherActivities: string
  attended: boolean
  attendanceId?: number
}

export type OffenderActivityId = {
  bookingId: number
  activityId: number
}
