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
