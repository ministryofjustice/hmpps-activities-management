// eslint-disable-next-line import/no-cycle
import SimpleDate from '../../commonValidationTypes/simpleDate'

export type CreateAnActivityJourney = {
  activityId?: number
  category?: {
    id: number
    name: string
  }
  name?: string
  riskLevel?: string
  payRateTypeOption?: string
  minimumPayRate?: number
  maximumPayRate?: number
  pay?: Array<{
    incentiveNomisCode: string
    incentiveLevel: string
    bandId: number
    bandAlias: string
    displaySequence: number
    rate: number
  }>
  flat?: Array<{
    bandId: number
    bandAlias: string
    displaySequence: number
    rate: number
  }>
  minimumIncentiveNomisCode?: string
  minimumIncentiveLevel?: string
  qualificationOption?: string
  educationLevels?: Array<{
    educationLevelCode: string
    educationLevelDescription: string
  }>
  startDate?: SimpleDate
  endDateOption?: string
  endDate?: SimpleDate
  days?: string[]
  timeSlotsMonday?: string[]
  timeSlotsTuesday?: string[]
  timeSlotsWednesday?: string[]
  timeSlotsThursday?: string[]
  timeSlotsFriday?: string[]
  timeSlotsSaturday?: string[]
  timeSlotsSunday?: string[]
  inCell?: boolean
  location?: {
    id: number
    name: string
  }
  currentCapacity?: number
  capacity?: number
  allocationCount?: number
  runsOnBankHoliday?: boolean
}
