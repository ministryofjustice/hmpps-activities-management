export enum AppointmentFrequency {
  WEEKDAY = 'WEEKDAY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  FORTNIGHTLY = 'FORTNIGHTLY',
  MONTHLY = 'MONTHLY',
}

export enum AppointmentApplyTo {
  THIS_APPOINTMENT = 'THIS_APPOINTMENT',
  THIS_AND_ALL_FUTURE_APPOINTMENTS = 'THIS_AND_ALL_FUTURE_APPOINTMENTS',
  ALL_FUTURE_APPOINTMENTS = 'ALL_FUTURE_APPOINTMENTS',
}

export type AppointmentApplyToOption = {
  applyTo: AppointmentApplyTo
  description: string
  additionalDescription?: string
}

export enum AppointmentCancellationReason {
  CREATED_IN_ERROR = '1',
  CANCELLED = '2',
}
