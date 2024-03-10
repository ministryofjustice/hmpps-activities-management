import { AppointmentPrisonerDetails } from './appointmentPrisonerDetails'

export type AppointmentSetJourney = {
  appointments?: {
    startTime?: {
      hour: number
      minute: number
    }
    endTime?: {
      hour: number
      minute: number
    }
    prisoner?: AppointmentPrisonerDetails
    extraInformation?: string
  }[]
}
