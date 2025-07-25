export type PrisonerAllocationsJourney = {
  activityName?: string
  status?: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ALLOCATED' | 'REMOVED'
  scheduleId?: number
  applicationId?: number
  applicationDate?: string
  requestedBy?: string
  comments?: string
}
