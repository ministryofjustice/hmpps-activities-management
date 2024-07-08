export type SessionCancellationRequest = {
  reason: string
  comment?: string
}

export enum AttendActivityMode {
  MULTIPLE = 'MULTIPLE',
  SINGLE = 'SINGLE',
}

export type RecordAttendanceRequests = {
  sessionCancellation?: SessionCancellationRequest
  mode?: AttendActivityMode
  selectedInstanceIds?: string[]
  activityDate?: string
  sessionFilters?: string[]
}
