import { YesNo } from '../../../@types/activities'
import { AppointmentFrequency } from '../../../@types/appointments'

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
  prisoners?: {
    number: string
    name: string
    cellLocation: string
  }[]
  category?: {
    code: string
    description: string
  }
  tierCode?: string
  organiserCode?: string
  customName?: string
  location?: {
    id: number
    description: string
  }
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
