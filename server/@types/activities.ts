import { ActivityCategory, ScheduledEvent } from './activitiesAPI/types'
import { Prisoner } from './prisonerOffenderSearchImport/types'

export type PrisonerAlert = {
  alertType: string
  alertCode: string
}

export type AllocationsSummary = {
  capacity?: number
  allocated?: number
  percentageAllocated: number
  vacancies: number
}

export type UnlockListItem = Prisoner & {
  displayName?: string
  locationGroup?: string
  locationSubGroup: string
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

export type AttendanceSummaryFilters = {
  activityDate: Date
  categories: string[]
  categoryFilters: FilterItem[]
}

export type SubLocationCellPattern = {
  subLocation: string
  locationPrefix: string
}

export enum YesNo {
  YES = 'YES',
  NO = 'NO',
}
