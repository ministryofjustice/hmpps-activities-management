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
}
