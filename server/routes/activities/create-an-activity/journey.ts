// eslint-disable-next-line import/no-cycle
import { ActivityPay, Allocation } from '../../../@types/activitiesAPI/types'
import TimeSlot from '../../../enum/timeSlot'

export enum ScheduleFrequency {
  WEEKLY = 1,
  BI_WEEKLY = 2,
}

export type DailySlots = {
  days?: string[]
  timeSlotsMonday?: DailySlot[]
  timeSlotsTuesday?: DailySlot[]
  timeSlotsWednesday?: DailySlot[]
  timeSlotsThursday?: DailySlot[]
  timeSlotsFriday?: DailySlot[]
  timeSlotsSaturday?: DailySlot[]
  timeSlotsSunday?: DailySlot[]
}

// TODO custom
export type DailySlot = {
  timeSlot: TimeSlot
  customStartTime?: string
  customEndTime?: string
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
  tierCode?: string
  organiserCode?: string
  riskLevel?: string
  minimumPayRate?: number
  maximumPayRate?: number
  attendanceRequired?: boolean
  paid?: boolean
  pay?: ActivityPay[]
  flat?: ActivityPay[]
  qualificationOption?: string
  educationLevels?: Array<{
    studyAreaCode: string
    studyAreaDescription: string
    educationLevelCode: string
    educationLevelDescription: string
  }>
  startDate?: string
  endDateOption?: string
  endDate?: string
  latestAllocationStartDate?: string
  earliestAllocationStartDate?: string
  scheduleWeeks?: number
  slots?: DailySlots
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
  incentiveLevel?: string
}
