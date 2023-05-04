import { ActivityCategory, Attendance, InternalLocation, ScheduledEvent } from './activitiesAPI/types'
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

export type AllocationsSummary = {
  capacity?: number
  allocated?: number
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

export type FilterItem = {
  value: string
  text: string
  checked: boolean
}

export type UnlockFilters = {
  location: string
  cellPrefix: string
  unlockDate: Date
  timeSlot: string
  subLocations: string[]
  locationFilters: FilterItem[]
  activityFilters: FilterItem[]
  stayingOrLeavingFilters: FilterItem[]
}

export type ActivitiesFilters = {
  activityDate: Date
  searchTerm: string
  categories: ActivityCategory[]
  sessionFilters: FilterItem[]
  categoryFilters: FilterItem[]
  locationFilters: FilterItem[]
}

export type SubLocationCellPattern = {
  subLocation: string
  locationPrefix: string
}

export enum YesNo {
  YES = 'YES',
  NO = 'NO',
}
