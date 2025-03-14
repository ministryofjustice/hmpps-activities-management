import { Inmate } from '../../routes/activities/manage-allocations/journey'
import { Activity, Allocation, PrisonerAllocations } from '../../@types/activitiesAPI/types'

export type PrisonerAllocated = {
  prisonerNumber: string
  allocated: boolean
}

export function mapPrisonersAllocated(prisonerNumbers: string[], allocated: string[]): PrisonerAllocated[] {
  return prisonerNumbers.map(prisonerNumber => {
    return {
      prisonerNumber,
      allocated: allocated.includes(prisonerNumber),
    }
  })
}

export function inmatesAllocated(
  inmates: Inmate[],
  currentAllocations: Allocation[],
  alreadyAllocated: boolean,
): Inmate[] {
  const allocationPrisonNumbers: string[] = currentAllocations.map(allocation => {
    return allocation.prisonerNumber
  })
  if (alreadyAllocated) {
    return inmates.filter(inmate => !allocationPrisonNumbers.includes(inmate.prisonerNumber))
  }
  return inmates.filter(inmate => allocationPrisonNumbers.includes(inmate.prisonerNumber))
}

export function inmatesWithMatchingIncentiveLevel(inmates: Inmate[], activity: Activity): Inmate[] {
  const incentiveLevels: string[] = activity.pay.map(pay => {
    return pay.incentiveLevel
  })
  return inmates.filter(i => incentiveLevels.includes(i.incentiveLevel))
}

export function inmatesWithoutMatchingIncentiveLevel(inmates: Inmate[], activity: Activity): Inmate[] {
  const incentiveLevels: string[] = activity.pay.map(pay => {
    return pay.incentiveLevel
  })
  return inmates.filter(i => !incentiveLevels.includes(i.incentiveLevel))
}

export function addOtherAllocations(
  inmates: Inmate[],
  prisonerAllocationsList: PrisonerAllocations[],
  scheduleId: number,
) {
  inmates.forEach(inmate => {
    const i = inmate
    i.otherAllocations = prisonerAllocationsList
      .find(p => p.prisonerNumber === inmate.prisonerNumber)
      .allocations.filter(a => a.scheduleId !== scheduleId)
  })
}
