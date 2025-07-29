import { ActivitySchedule, Allocation, ScheduledInstance, Slot } from '../../../@types/activitiesAPI/types'

export type Inmate = {
  prisonerName: string
  firstName?: string
  middleNames?: string
  lastName?: string
  prisonerNumber: string
  prisonCode: string
  status: string
  cellLocation?: string
  incentiveLevel?: string
  payBand?: {
    id: number
    alias: string
    rate: number
  }
  otherAllocations?: Allocation[]
  startDate?: string
  nonAssociations?: boolean
  numberPayBandsAvailable?: number
}

export type AllocateToActivityJourney = {
  inmate: Inmate
  inmates?: Array<Inmate>
  activity: {
    activityId?: number
    scheduleId: number
    name: string
    location?: string
    inCell?: boolean
    onWing?: boolean
    offWing?: boolean
    startDate: string
    endDate?: string
    scheduleWeeks?: number
    paid?: boolean
    notInWork?: boolean
  }
  startDateOption?: StartDateOption
  deallocateTodayOption?: DeallocateTodayOption
  deallocateAfterAllocationDateOption?: DeallocateAfterAllocationDateOption
  unidentifiable?: boolean
  startDate?: string
  endDate?: string
  deallocationReason?: string
  latestAllocationStartDate?: string
  exclusions?: Array<Slot>
  updatedExclusions?: Array<Slot>
  deallocationCaseNote?: {
    type: string
    text: string
  }
  notFoundPrisoners?: string[]
  scheduledInstance?: ScheduledInstance
  otherAllocations?: Array<Allocation>
  activitiesToDeallocate?: {
    activityId?: number
    scheduleId: number
    name: string
    location?: string
    inCell?: boolean
    onWing?: boolean
    offWing?: boolean
    startDate: string
    endDate?: string
    scheduleWeeks?: number
    paid?: boolean
    notInWork?: boolean
    schedule?: ActivitySchedule
  }[]
  withoutMatchingIncentiveLevelInmates?: Array<Inmate>
  allocatedInmates?: Array<Inmate>
  allocateMultipleInmatesMode?: boolean
}

export enum EndDecision {
  BEFORE_START = 'BEFORE_START',
  AFTER_START = 'AFTER_START',
}

export enum StartDateOption {
  NEXT_SESSION = 'NEXT_SESSION',
  START_DATE = 'START_DATE',
}

export enum DeallocateTodayOption {
  TODAY = 'TODAY',
  EOD = 'EOD',
  FUTURE_DATE = 'FUTURE_DATE',
}

export enum DeallocateAfterAllocationDateOption {
  NOW = 'NOW',
  TODAY = 'TODAY',
  FUTURE_DATE = 'FUTURE_DATE',
}

export enum PrisonerSuspensionStatus {
  SUSPENDED = 'SUSPENDED',
  SUSPENDED_WITH_PAY = 'SUSPENDED_WITH_PAY',
}
