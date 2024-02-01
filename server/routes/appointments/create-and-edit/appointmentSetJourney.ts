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
    prisoner?: {
      number: string
      name: string
      status: string
      prisonCode: string
      cellLocation: string
    }
    extraInformation?: string
  }[]
}
