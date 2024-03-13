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
  }[]
  earliestAllocationStartDate: string
  earliestAllocationEndDate?: string
  suspendFrom?: string
  suspendUntil?: string
  caseNote?: {
    type: string
    text: string
  }
}
