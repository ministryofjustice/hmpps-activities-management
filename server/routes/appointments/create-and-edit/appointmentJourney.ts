import { YesNo } from '../../../@types/activities'
import { AppointmentFrequency } from '../../../@types/appointments'
import EventOrganiser from '../../../enum/eventOrganisers'
import EventTier from '../../../enum/eventTiers'
import { AppointmentPrisonerDetails } from './appointmentPrisonerDetails'

export enum AppointmentType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
  SET = 'SET',
}

export enum AppointmentJourneyMode {
  CREATE = 'CREATE',
  EDIT = 'EDIT',
}

export type AppointmentJourney = {
  mode: AppointmentJourneyMode
  type: AppointmentType
  createJourneyComplete?: boolean
  appointmentName?: string
  prisoners?: AppointmentPrisonerDetails[]
  category?: {
    code: string
    description: string
  }
  tierCode?: EventTier
  organiserCode?: EventOrganiser
  customName?: string
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
  repeat?: YesNo
  frequency?: AppointmentFrequency
  numberOfAppointments?: number
  extraInformation?: string
  fromPrisonNumberProfile?: string
}
