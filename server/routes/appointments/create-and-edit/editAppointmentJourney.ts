import { AppointmentSeriesSummary, AppointmentSetSummary, PrisonerSummary } from '../../../@types/activitiesAPI/types'
import { AppointmentCancellationReason } from '../../../@types/appointments'
import EventOrganiser from '../../../enum/eventOrganisers'
import EventTier from '../../../enum/eventTiers'
import { AppointmentPrisonerDetails } from './appointmentPrisonerDetails'

export type EditAppointmentJourney = {
  numberOfAppointments: number
  appointments: {
    sequenceNumber: number
    startDate: string
    cancelled: boolean
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
  addPrisoners?: AppointmentPrisonerDetails[]
  removePrisoner?: PrisonerSummary
  cancellationReason?: AppointmentCancellationReason
  uncancel?: boolean
}
