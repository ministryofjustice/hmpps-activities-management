import { PrisonerScheduleLenient } from './prisonApiImportCustom'

export type NameValueStringPair = {
  name: string
  value: string
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
  paid?: boolean
  locked?: boolean
  other?: boolean
  pay?: boolean
}

export type OffenderActivitiesByLocation = OffenderData & {
  eventsElsewhere: PrisonerScheduleLenient[]
  attendanceInfo: AttendanceInfo
}

export type ActivityByLocation = PrisonerScheduleLenient & OffenderActivitiesByLocation

export type ActivityListTableRow = {
  name: string
  location: string
  prisonNumber: string
  relevantAlerts: string
  activity: string
  otherActivities: string
}
