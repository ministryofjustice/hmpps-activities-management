export type CreateAnActivityJourney = {
  category?: {
    id: number
    name: string
  }
  name?: string
  riskLevel?: string
  pay?: Array<{
    incentiveLevel: string
    bandId: number
    bandAlias: string
    displaySequence: number
    rate: number
  }>
  minimumIncentiveLevel?: string
}
