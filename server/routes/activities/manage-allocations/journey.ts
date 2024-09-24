import { ScheduledInstance, Slot } from '../../../@types/activitiesAPI/types'

type Inmate = {
  prisonerName: string
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
  }
  startDateOption?: StartDateOption
  deallocateTodayOption?: DeallocateTodayOption
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
  scheduledInstance?: ScheduledInstance
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
  FUTURE_DATE = 'FUTURE_DATE',
}
