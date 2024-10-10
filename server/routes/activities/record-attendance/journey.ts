export type RecordAttendanceJourney = {
  sessionCancellation?: SessionCancellationRequest
  selectedInstanceIds?: string[]
  activityDate?: string
  sessionFilters?: string[]
  singleInstanceSelected?: boolean
  notAttended?: NotAttendedJourney
}

type NotAttendedJourney = {
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

export type SessionCancellationRequest = {
  reason: string
  comment?: string
}
