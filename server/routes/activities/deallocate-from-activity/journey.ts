import SimpleDate from '../../../commonValidationTypes/simpleDate'

export type DeallocateFromActivityJourney = {
  allocationsToRemove: string[]
  scheduleId: number
  activityName: string
  prisoners?: Array<{
    name: string
    prisonerNumber: string
    cellLocation: string
  }>
  deallocationDate?: SimpleDate
  deallocationReason?: string
  earliestAllocationStartDate?: string
}
