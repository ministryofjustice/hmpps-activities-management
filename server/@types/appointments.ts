import { AppointmentCategory } from './activitiesAPI/types'
import { LocationLenient } from './prisonApiImportCustom'
import { Prisoner } from './activities'

export type AppointmentDetails = {
  id: number
  category: AppointmentCategory
  internalLocation: LocationLenient
  inCell: boolean
  startDate: Date
  startTime: Date
  endTime?: Date
  comment: string
  created: Date
  createdBy: string
  updated?: Date
  updatedBy?: string
  occurrences: AppointmentOccurrenceSummary[]
  prisoners: Prisoner[]
  prisonerMap: Map<string, Prisoner>
}

export type AppointmentOccurrenceSummary = {
  id: number
  internalLocation: LocationLenient
  inCell: boolean
  startDate: Date
  startTime: Date
  endTime?: Date
  comment: string
  isCancelled: boolean
  updated?: string
  updatedBy?: Date
  isEdited: boolean
}
