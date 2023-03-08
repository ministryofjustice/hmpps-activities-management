export type NotAttendedJourney = {
  selectedPrisoners?: Array<{
    attendanceId?: number
    prisonerNumber?: string
    prisonerName?: string
    otherEvents: {
      location?: string
      event?: string
    }[]
  }>
}
