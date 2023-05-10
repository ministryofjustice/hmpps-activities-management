export type EditAppointmentJourney = {
  repeatCount: number
  occurrencesRemaining: number
  sequenceNumber: number
  updatedProperties?: string[]
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
}
