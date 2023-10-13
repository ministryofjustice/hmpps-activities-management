export type WaitListApplicationJourney = {
  prisoner?: {
    prisonerNumber: string
    name: string
  }
  requestDate?: string
  activity?: {
    activityId: number
    scheduleId: number
    activityName: string
  }
  requester?: string
  status?: string
  comment?: string
  createdTime?: string
}
