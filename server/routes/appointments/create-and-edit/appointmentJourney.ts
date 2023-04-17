import { YesNo } from '../../../@types/activities'
import { AppointmentRepeatPeriod } from '../../../@types/appointments'

export enum AppointmentType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
}

export enum AppointmentJourneyMode {
  CREATE = 'CREATE',
  EDIT = 'EDIT',
}

export type AppointmentJourney = {
  mode: AppointmentJourneyMode
  type: AppointmentType
  prisoners?: {
    number: string
    name: string
    cellLocation: string
  }[]
  category?: {
    code: string
    description: string
  }
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
  repeat?: YesNo
  repeatPeriod?: AppointmentRepeatPeriod
  repeatCount?: number
}
