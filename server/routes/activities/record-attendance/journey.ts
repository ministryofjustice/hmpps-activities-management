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
  returnUrl?: string
  locationTypeFilter?: string
  searchTerm?: string
  subLocationFilters?: string[]
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

type CancellationRequest = {
  activityName: string
  reason: string
  comment?: string
  issuePayment: boolean
}

export type SessionCancellationRequest = CancellationRequest

export type MultipleSessionCancellationRequest = Omit<CancellationRequest, 'activityName'>

export type SingleSessionCancellationRequest = CancellationRequest
