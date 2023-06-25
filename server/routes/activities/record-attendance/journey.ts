export type NotAttendedJourney = {
  selectedPrisoners?: Array<{
    attendanceId?: number
    prisonerNumber?: string
    prisonerName?: string
    otherEvents: {
      internalLocationDescription?: string
      summary?: string
    }[]
  }>
}
