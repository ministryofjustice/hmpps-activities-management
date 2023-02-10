export type CreateSingleAppointmentJourney = {
  prisoner?: {
    number: string
    displayName: string
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
  }
  startTime?: {
    hour: number
    minute: number
  }
  endTime?: {
    hour: number
    minute: number
  }
}
