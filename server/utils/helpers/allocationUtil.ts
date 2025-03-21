import { Inmate } from '../../routes/activities/manage-allocations/journey'
import { Activity, Allocation, PrisonerAllocations } from '../../@types/activitiesAPI/types'
import { Prisoner } from '../../@types/prisonerOffenderSearchImport/types'

export type PrisonerAllocated = {
  prisonerNumber: string
  allocated: boolean
}

export interface payBandDetail {
  bandId: number
  bandAlias: string
  rate: number
  startDate?: string
  description?: string
  incentiveLevel?: string
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
  const allocated = inmates.filter(inmate => allocationPrisonNumbers.includes(inmate.prisonerNumber))
  allocated.forEach(inmate => {
    const i = inmate
    const alloc = currentAllocations.find(cA => i.prisonerNumber === cA.prisonerNumber)
    i.startDate = alloc.startDate
  })
  return allocated
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
    i.otherAllocations =
      prisonerAllocationsList
        .find(p => p.prisonerNumber === inmate.prisonerNumber)
        ?.allocations.filter(a => a.scheduleId !== scheduleId) || []
  })
}

export function addNonAssociations(inmates: Inmate[], prisonersWithNonAssociations: string[]) {
  inmates.forEach(inmate => {
    const i = inmate
    i.nonAssociations = prisonersWithNonAssociations?.includes(inmate.prisonerNumber)
  })
}

export function addPayBand(
  inmates: Inmate[],
  payBandsPerPrisoner: { prisonerNumber: string; payBandDetail: payBandDetail }[],
) {
  inmates.forEach(inmate => {
    const i = inmate
    const paybandDetails = payBandsPerPrisoner.find(pb => pb.prisonerNumber === inmate.prisonerNumber)
    const payBand = paybandDetails?.payBandDetail

    if (payBand !== undefined) {
      i.payBand = {
        id: payBand?.bandId,
        alias: payBand?.bandAlias,
        rate: payBand?.rate,
      }
    }
  })
}

export function convertPrisonersToInmates(prisoners: Prisoner[]): Inmate[] {
  return prisoners.map(prisoner => ({
    prisonerName: `${prisoner.firstName} ${prisoner.lastName}`,
    firstName: prisoner.firstName,
    middleNames: prisoner.middleNames,
    lastName: prisoner.lastName,
    prisonerNumber: prisoner.prisonerNumber,
    prisonCode: prisoner.prisonId,
    status: prisoner.status,
    cellLocation: prisoner.cellLocation,
    incentiveLevel: prisoner.currentIncentive?.level.description,
    payBand: undefined,
  }))
}
