import { PrisonPayBand } from '../../../@types/activitiesAPI/types'

type Inmate = {
  prisonerName: string
  prisonerNumber: string
}

export type SuspendJourney = {
  inmate: Inmate
  allocations: {
    activityId: number
    allocationId: number
    activityName: string
    payBand: PrisonPayBand
  }[]
  earliestAllocationEndDate?: string
  suspendFrom?: string
  suspendUntil?: string
  caseNote?: {
    type: string
    text: string
  }
  paid?: string
}
