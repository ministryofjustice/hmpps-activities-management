import {
  AppointmentCategorySummary,
  AppointmentLocationSummary,
  PrisonerSummary,
  UserSummary,
} from './activitiesAPI/types'

export type MovementSlip = {
  category: AppointmentCategorySummary
  internalLocation?: AppointmentLocationSummary
  inCell: boolean
  startDate: string
  startTime: string
  endTime?: string
  comment: string
  created: string
  createdBy: UserSummary
  prisoners: PrisonerSummary[]
}

export enum AppointmentRepeatPeriod {
  WEEKDAY = 'WEEKDAY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  FORTNIGHTLY = 'FORTNIGHTLY',
  MONTHLY = 'MONTHLY',
}

export enum EditApplyTo {
  THIS_OCCURRENCE = 'THIS_OCCURRENCE',
  THIS_AND_ALL_FUTURE_OCCURRENCES = 'THIS_AND_ALL_FUTURE_OCCURRENCES',
  ALL_FUTURE_OCCURRENCES = 'ALL_FUTURE_OCCURRENCES',
}

export enum AppointmentCancellationReason {
  CREATED_IN_ERROR = 1,
  CANCELLED = 2,
}
