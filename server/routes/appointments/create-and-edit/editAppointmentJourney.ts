import { PrisonerSummary } from '../../../@types/activitiesAPI/types'
import { EditApplyTo } from '../../../@types/appointments'

export type EditAppointmentJourney = {
  repeatCount: number
  occurrencesRemaining: number
  sequenceNumber: number
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
  addPrisoners?: {
    number: string
    name: string
    cellLocation: string
  }[]
  removePrisoner?: PrisonerSummary
  applyTo?: EditApplyTo
}
