import SimpleDate from '../../commonValidationTypes/simpleDate'

export type AllocateToActivityJourney = {
  inmate?: {
    prisonerName: string
    prisonerNumber: string
    cellLocation?: string
    incentiveLevel?: string
    payBand?: {
      id: number
      alias: string
    }
  }
  activity?: {
    activityId?: number
    scheduleId: number
    name: string
    location?: string
  }
  startDate?: SimpleDate
  endDate?: SimpleDate
}
