export type NotAttendedJourney = {
  selectedPrisoners?: Array<{
    instanceId?: number
    attendanceId?: number
    prisonerNumber?: string
    prisonerName?: string
    otherEvents: {
      internalLocationDescription?: string
      summary?: string
    }[]
  }>
}
