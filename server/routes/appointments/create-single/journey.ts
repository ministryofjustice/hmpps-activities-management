import { YesNo } from '../../../@types/activities'
import { AppointmentRepeatPeriod } from '../../../@types/activitiesAPI/types'

export type CreateSingleAppointmentJourney = {
  title: string
  prisoner?: {
    number: string
    name: string
    cellLocation: string
  }
  category?: {
    id: number
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
