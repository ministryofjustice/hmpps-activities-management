export type SessionCancellationRequest = {
  reason: string
  comment?: string
}

export type RecordAttendanceRequests = {
  sessionCancellation: SessionCancellationRequest
}
