export type AllocateToActivityJourney = {
  inmate: {
    prisonerName: string
    prisonerNumber: string
    cellLocation: string
    incentiveLevel: string
    payBand?: string
  }
  activity: {
    activityId: number
    scheduleId: number
    name: string
    location: string
  }
}
