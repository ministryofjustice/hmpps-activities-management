import { Attendance, InternalLocation } from './activitiesAPI/types'

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
  startTime: string
  endTime: string
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
  attended: boolean
}
