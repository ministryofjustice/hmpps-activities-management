export type DeallocateFromActivityJourney = {
  allocationsToRemove: string[]
  scheduleId: number
  activityName: string
  prisoners?: Array<{
    name: string
    prisonerNumber: string
    cellLocation: string
  }>
  deallocationDate?: string
  deallocationReason?: string
}
