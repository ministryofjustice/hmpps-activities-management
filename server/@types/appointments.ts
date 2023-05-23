export enum AppointmentRepeatPeriod {
  WEEKDAY = 'WEEKDAY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  FORTNIGHTLY = 'FORTNIGHTLY',
  MONTHLY = 'MONTHLY',
}

export enum AppointmentApplyTo {
  THIS_OCCURRENCE = 'THIS_OCCURRENCE',
  THIS_AND_ALL_FUTURE_OCCURRENCES = 'THIS_AND_ALL_FUTURE_OCCURRENCES',
  ALL_FUTURE_OCCURRENCES = 'ALL_FUTURE_OCCURRENCES',
}

export type AppointmentApplyToOption = {
  applyTo: AppointmentApplyTo
  description: string
  additionalDescription: string
}

export enum AppointmentCancellationReason {
  CREATED_IN_ERROR = '1',
  CANCELLED = '2',
}
