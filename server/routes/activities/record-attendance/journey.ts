export type RecordAttendanceJourney = {
  sessionCancellation?: SessionCancellationRequest
  sessionCancellationMultiple?: MultipleSessionCancellationRequest
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
    firstName: string
    lastName: string
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

export type MultipleSessionCancellationRequest = {
  reason: string
  comment?: string
  issuePayment: boolean
}
