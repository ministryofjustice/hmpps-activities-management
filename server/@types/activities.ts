import { Attendance, InternalLocation, ScheduledEvent } from './activitiesAPI/types'
import { Alert } from './prisonApiImport/types'
import { PrisonerAlert as PrisonerSearchAlert } from './prisonerOffenderSearchImport/types'

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
  isLeavingWing: boolean
}

export type MovementListItem = {
  prisonerNumber: string
  firstName: string
  lastName: string
  cellLocation: string
  category: string
  status: string
  alerts?: PrisonerSearchAlert[]
  events?: ScheduledEvent[]
  clashingEvents?: ScheduledEvent[]
}

export type SubLocationCellPattern = {
  subLocation: string
  locationPrefix: string
}

export enum YesNo {
  YES = 'YES',
  NO = 'NO',
}

export enum EventType {
  ACTIVITY = 'ACTIVITY',
  APPOINTMENT = 'APPOINTMENT',
  COURT_HEARING = 'COURT_HEARING',
  VISIT = 'VISIT',
  EXTERNAL_TRANSFER = 'EXTERNAL_TRANSFER',
  ADJUDICATION_HEARING = 'ADJUDICATION_HEARING',
}

export enum EventSource {
  SCHEDULING_AND_ALLOCATION = 'SAA',
  NOMIS = 'NOMIS',
}
