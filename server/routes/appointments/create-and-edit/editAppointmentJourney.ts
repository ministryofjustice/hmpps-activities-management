import { AppointmentSeriesSummary, AppointmentSetSummary, PrisonerSummary } from '../../../@types/activitiesAPI/types'
import { AppointmentCancellationReason } from '../../../@types/appointments'
import EventOrganiser from '../../../enum/eventOrganisers'
import EventTier from '../../../enum/eventTiers'

export type EditAppointmentJourney = {
  numberOfAppointments: number
  appointments: {
    sequenceNumber: number
    startDate: string
  }[]
  sequenceNumber: number
  appointmentSeries?: AppointmentSeriesSummary
  appointmentSet?: AppointmentSetSummary
  property?: string
  tierCode?: EventTier
  organiserCode?: EventOrganiser
  location?: {
    id: number
    description: string
  }
  inCell?: boolean
  startDate?: string
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
    prisonCode: string
    cellLocation: string
    status: string
    alertCodes?: {
      category: string
      alerts: {
        alertCode: string
        alertType: string
      }[]
    }[]
    alertDescriptions?: string[]
    profileAlertExists?: boolean
  }[]
  removePrisoner?: PrisonerSummary
  cancellationReason?: AppointmentCancellationReason
}
