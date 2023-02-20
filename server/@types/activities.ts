import { Attendance, InternalLocation, ScheduledEvent } from './activitiesAPI/types'
import { Alert } from './prisonApiImport/types'

export type PrisonerAlert = {
  alertType: string
  alertCode: string
}

export type Prisoner = {
  prisonerNumber?: string
  firstName?: string
  middleNames?: string
  lastName?: string
  cellLocation?: string
  alerts?: PrisonerAlert[]
  category?: string
}

export type ActivityScheduleAllocation = {
  activityScheduleId: number
  description: string
  internalLocation?: InternalLocation
  prisoner: Prisoner
  attendance?: Attendance
}

export type ActivityListTableRow = {
  id: number
  name: string
  location: string
  prisonNumber: string
  relevantAlerts: string[]
  activity: string
  attended?: boolean
  attendanceId?: number
  payDecision?: boolean
  paidReason?: string
  unpaidReason?: string
}

export type AttendanceForm = {
  pay?: string
  moreDetail?: string
  paidReason?: string
  unpaidReason?: string
  incentiveWarning?: string
}

export type ActivityAttendanceId = {
  id: number
  attendanceId: number
}

export type CandidateListTableRow = {
  name: string
  location: string
  prisonNumber: string
  incentiveLevel: string
  alerts: string[]
}

export type AllocationsSummary = {
  capacity: number
  allocated: number
  percentageAllocated: number
  vacancies: number
}

export type UnlockListItem = {
  prisonerNumber: string
  bookingId: number
  firstName: string
  lastName: string
  displayName?: string
  locationGroup?: string
  locationSubGroup: string
  cellLocation: string
  alerts?: Alert[]
  events?: ScheduledEvent[]
  status: string
}

export type UnlockFilterItem = {
  value: string
  text: string
  checked: boolean
}

export type UnlockFilters = {
  location: string
  cellPrefix: string
  unlockDate: string
  formattedDate: string
  timeSlot: string
  subLocations: string[]
  locationFilters: UnlockFilterItem[]
  activityFilters: UnlockFilterItem[]
  stayingOrLeavingFilters: UnlockFilterItem[]
}

export type SubLocationCellPattern = {
  subLocation: string
  locationPrefix: string
}
