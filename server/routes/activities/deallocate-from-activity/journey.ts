import SimpleDate from '../../../commonValidationTypes/simpleDate'

export type DeallocateFromActivityJourney = {
  allocationsToRemove: string[]
  scheduleId: number
  activity: {
    id: number
    activityName: string
    endDate?: string
  }
  prisoners?: Array<{
    name: string
    prisonerNumber: string
    cellLocation: string
  }>
  deallocationDate?: SimpleDate
  deallocationReason?: string
  latestAllocationStartDate?: string
}
