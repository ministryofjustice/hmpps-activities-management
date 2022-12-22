export type CreateAnActivityJourney = {
  category?: {
    id: number
    name: string
  }
  name?: string
  riskLevel?: string
  minimumIncentive?: string
  incentiveLevels?: string[]
}
