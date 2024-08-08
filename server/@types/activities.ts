import { ScheduledEvent } from './activitiesAPI/types'
import { Alert } from './prisonApiImport/types'
import { PrisonerAlert } from './prisonerOffenderSearchImport/types'

export type Prisoner = {
  prisonerNumber?: string
  firstName?: string
  middleNames?: string
  lastName?: string
  cellLocation?: string
  alerts?: PrisonerAlert[]
  category?: string
}

export type UnlockListItem = {
  prisonerNumber: string
  bookingId: number
  prisonerName: string
  displayName?: string
  locationGroup?: string
  locationSubGroup: string
  cellLocation: string
  category?: string
  alerts?: Alert[]
  events?: ScheduledEvent[]
  status: string
  isLeavingWing: boolean
}

export type MovementListLocation = {
  id: number
  code: string
  description: string
  prisonerEvents: MovementListPrisonerEvents[]
}

export type MovementListPrisonerEvents = {
  prisonerNumber: string
  firstName: string
  lastName: string
  cellLocation: string
  category: string
  status: string
  alerts?: PrisonerAlert[]
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

export enum PayNoPay {
  PAID = 'PAID',
  NO_PAY = 'NO_PAY',
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
