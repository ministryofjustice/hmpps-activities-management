export type RecordAttendanceJourney = {
  sessionCancellation?: SessionCancellationRequest
  sessionCancellationMultiple?: MultipleSessionCancellationRequest
  sessionCancellationSingle?: SingleSessionCancellationRequest
  selectedInstanceIds?: string[]
  activityDate?: string
  sessionFilters?: string[]
  singleInstanceSelected?: boolean
  notAttended?: NotAttendedJourney
  notRequiredOrExcused?: NotRequiredOrExcusedJourney
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

type NotRequiredOrExcusedJourney = {
  selectedPrisoners?: Array<{
    instanceId?: number
    prisonerNumber?: string
    prisonerName?: string
  }>
  isPaid?: boolean
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

export type SingleSessionCancellationRequest = {
  activityName: string
  reason: string
  comment?: string
  issuePayment: boolean
}
