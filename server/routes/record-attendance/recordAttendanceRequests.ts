export type SessionCancellationRequest = {
  reason: string
  comments?: string
}

export type RecordAttendanceRequests = {
  sessionCancellation: SessionCancellationRequest
}
