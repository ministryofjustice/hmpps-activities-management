export type BulkAppointmentJourney = {
  appointments?: {
    startTime?: {
      hour: number
      minute: number
    }
    endTime?: {
      hour: number
      minute: number
    }
    prisoner?: {
      number: string
      name: string
      cellLocation: string
    }
  }[]
}
