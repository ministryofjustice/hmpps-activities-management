import { AppointmentSeriesSummary, AppointmentSetSummary, PrisonerSummary } from '../../../@types/activitiesAPI/types'
import { AppointmentCancellationReason, AppointmentApplyTo } from '../../../@types/appointments'

export type EditAppointmentJourney = {
  numberOfAppointments: number
  appointments: {
    sequenceNumber: number
    startDate: string
  }[]
  sequenceNumber: number
  appointmentSeries?: AppointmentSeriesSummary
  appointmentSet?: AppointmentSetSummary
  location?: {
    id: number
    description: string
  }
  startDate?: {
    day: number
    month: number
    year: number
    date: Date
  }
  startTime?: {
    hour: number
    minute: number
    date: Date
  }
  endTime?: {
    hour: number
    minute: number
    date: Date
  }
  extraInformation?: string
  addPrisoners?: {
    number: string
    name: string
    cellLocation: string
  }[]
  removePrisoner?: PrisonerSummary
  cancellationReason?: AppointmentCancellationReason
  applyTo?: AppointmentApplyTo
}
