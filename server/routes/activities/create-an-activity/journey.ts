// eslint-disable-next-line import/no-cycle
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import { ActivityPay, Allocation } from '../../../@types/activitiesAPI/types'

export enum ScheduleFrequency {
  WEEKLY = 1,
  BI_WEEKLY = 2,
}

export type Slots = {
  days?: string[]
  timeSlotsMonday?: string[]
  timeSlotsTuesday?: string[]
  timeSlotsWednesday?: string[]
  timeSlotsThursday?: string[]
  timeSlotsFriday?: string[]
  timeSlotsSaturday?: string[]
  timeSlotsSunday?: string[]
}

export type CreateAnActivityJourney = {
  activityId?: number
  scheduleId?: number
  category?: {
    id: number
    code: string
    name: string
  }
  name?: string
  riskLevel?: string
  minimumPayRate?: number
  maximumPayRate?: number
  pay?: ActivityPay[]
  flat?: ActivityPay[]
  minimumIncentiveNomisCode?: string
  minimumIncentiveLevel?: string
  qualificationOption?: string
  educationLevels?: Array<{
    studyAreaCode: string
    studyAreaDescription: string
    educationLevelCode: string
    educationLevelDescription: string
  }>
  startDate?: SimpleDate
  endDateOption?: string
  endDate?: SimpleDate
  latestAllocationStartDate?: Date
  earliestAllocationStartDate?: Date
  scheduleWeeks?: number
  slots?: { [weekNumber: string]: Slots }
  inCell?: boolean
  onWing?: boolean
  offWing?: boolean
  location?: {
    id: number
    name: string
  }
  currentCapacity?: number
  capacity?: number
  allocations?: Allocation[]
  runsOnBankHoliday?: boolean
}
