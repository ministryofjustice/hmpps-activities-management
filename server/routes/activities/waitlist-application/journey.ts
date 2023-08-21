import SimpleDate from '../../../commonValidationTypes/simpleDate'

export type WaitListApplicationJourney = {
  prisoner?: {
    prisonerNumber: string
    name: string
  }
  requestDate?: SimpleDate
  activity?: {
    activityId: number
    activityName: string
  }
  requester?: string
  status?: string
  comment?: string
  createdTime?: string
}
