export type CreateSingleAppointmentJourney = {
  prisoner?: {
    number: string
    displayName: string
    cellLocation: string
    description: string
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
    display: string
  }
  startTime?: {
    hour: number
    minute: number
    display: string
  }
  endTime?: {
    hour: number
    minute: number
    display: string
  }
}
