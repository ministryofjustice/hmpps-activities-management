export type CreateAnActivityJourney = {
  category?: {
    id: number
    name: string
  }
  name?: string
  riskLevel?: string
  pay?: Array<{
    incentiveNomisCode: string
    incentiveLevel: string
    bandId: number
    bandAlias: string
    displaySequence: number
    rate: number
  }>
  minimumIncentiveNomisCode?: string
  minimumIncentiveLevel?: string
}
