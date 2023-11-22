import { Slot } from '../../../@types/activitiesAPI/types'

type Inmate = {
  prisonerName: string
  prisonerNumber: string
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
  }
  startDate?: string
  endDate?: string
  deallocationReason?: string
  latestAllocationStartDate?: string
  exclusions?: Array<Slot>
  updatedExclusions?: Array<Slot>
}
