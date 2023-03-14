import { components } from '.'

export type Activity = components['schemas']['Activity']
export type RolloutPrison = components['schemas']['RolloutPrison']
export type InternalLocation = components['schemas']['InternalLocation']
export type ActivitySchedule = components['schemas']['ActivitySchedule']
export type ActivityScheduleLite = components['schemas']['ActivityScheduleLite']
export type ActivityLite = components['schemas']['ActivityLite']
export type Attendance = components['schemas']['Attendance']
export type AttendanceUpdateRequest = components['schemas']['AttendanceUpdateRequest']
export type ActivityCategory = components['schemas']['ActivityCategory']
export type CapacityAndAllocated = components['schemas']['CapacityAndAllocated']
export type PrisonerScheduledEvents = components['schemas']['PrisonerScheduledEvents']
export type ScheduledEvent = components['schemas']['ScheduledEvent']
export type ScheduledActivity = components['schemas']['ActivityScheduleInstance']
export type LocationGroup = components['schemas']['LocationGroup']
export type LocationPrefix = components['schemas']['LocationPrefixDto']
export type Allocation = components['schemas']['Allocation']
export type PrisonerAllocations = components['schemas']['PrisonerAllocations']
export type ActivityCreateRequest = components['schemas']['ActivityCreateRequest']
export type ActivityScheduleCreateRequest = components['schemas']['ActivityScheduleCreateRequest']
export type Slot = components['schemas']['Slot']
export type PrisonPayBand = components['schemas']['PrisonPayBand']
export type Appointment = components['schemas']['Appointment']
export type AppointmentCategory = components['schemas']['AppointmentCategory']
export type AppointmentCreateRequest = components['schemas']['AppointmentCreateRequest']
export type AppointmentDetails = components['schemas']['AppointmentDetails']
export enum AppointmentRepeatPeriod {
  WEEKDAY = 'WEEKDAY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  FORTNIGHTLY = 'FORTNIGHTLY',
  MONTHLY = 'MONTHLY',
}
