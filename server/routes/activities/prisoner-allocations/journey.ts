import { ActivitySummary } from '../../../@types/activitiesAPI/types'

export type PrisonerAllocationsJourney = {
  activityName?: string
  status?: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ALLOCATED' | 'REMOVED'
  scheduleId?: number
  applicationId?: number
  applicationDate?: string
  requestedBy?: string
  comments?: string
}

export type WaitlistApplication = {
  activityId: number
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ALLOCATED' | 'REMOVED' | 'WITHDRAWN' | string
}

export type EnhancedWaitlistApplication = WaitlistApplication & {
  activity?: ActivitySummary
}
