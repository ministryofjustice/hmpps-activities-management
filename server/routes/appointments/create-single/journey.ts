export type CreateSingleAppointmentJourney = {
  prisoner?: {
    number: string
    bookingId: number
    displayName: string
  }
  category?: {
    id: number
    description: string
  }
  location?: {
    id: number
    description: string
  }
  startDate?: string
  startTime?: string
  endTime?: string
}
