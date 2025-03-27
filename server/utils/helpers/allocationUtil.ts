import { startOfToday } from 'date-fns'
import { Inmate } from '../../routes/activities/manage-allocations/journey'
import { Activity, Allocation, PrisonerAllocations } from '../../@types/activitiesAPI/types'
import { Prisoner } from '../../@types/prisonerOffenderSearchImport/types'
import { formatDate, parseISODate, toMoney } from '../utils'

export type PrisonerAllocated = {
  prisonerNumber: string
  allocated: boolean
}

export interface PayBandDetail {
  bandId: number
  bandAlias: string
  rate: number
  startDate?: string
  description?: string
  incentiveLevel?: string
}

export type InmatePayBandDisplayDetails = {
  prisonerNumber: string
  firstName: string
  middleNames: string
  lastName: string
  incentiveLevel: string
  prisonId: string
  payBands: PayBandDetail[]
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
  payBandsPerPrisoner: { prisonerNumber: string; payBandDetail: PayBandDetail; numberPayBandsAvailable: number }[],
) {
  inmates.forEach(inmate => {
    const i = inmate
    const paybandDetails = payBandsPerPrisoner.find(pb => pb.prisonerNumber === inmate.prisonerNumber)
    const payBand = paybandDetails?.payBandDetail

    if (payBand) {
      i.numberPayBandsAvailable = paybandDetails.numberPayBandsAvailable
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

export function getApplicablePayBandsForInmates(
  inmates: Inmate[],
  allPayBandsForActivity: PayBandDetail[],
): InmatePayBandDisplayDetails[] {
  const payBandsPerInmate: InmatePayBandDisplayDetails[] = []
  inmates.forEach(inmate => {
    const relevantPaybands = payBandWithDescription(allPayBandsForActivity, inmate.incentiveLevel)
    payBandsPerInmate.push({
      prisonerNumber: inmate.prisonerNumber,
      firstName: inmate.firstName,
      middleNames: inmate.middleNames,
      lastName: inmate.lastName,
      prisonId: inmate.prisonCode,
      incentiveLevel: inmate.incentiveLevel,
      payBands: relevantPaybands,
    })
  })
  return payBandsPerInmate
}

export function payBandWithDescription(originalPayBands: PayBandDetail[], incentiveLevel: string): PayBandDetail[] {
  const formattedPayBands: PayBandDetail[] = []
  const relevantOriginalPayBands = originalPayBands.filter(pb => pb.incentiveLevel === incentiveLevel)
  const uniquePayBandIds = [...new Set(relevantOriginalPayBands.map(pay => pay.bandId))]
  uniquePayBandIds.forEach(i => {
    const payBand = singlePayBandForPayBandId(relevantOriginalPayBands, i)
    formattedPayBands.push(payBand)
  })
  return formattedPayBands
}

function singlePayBandForPayBandId(originalPayBands: PayBandDetail[], bandId: number): PayBandDetail {
  const possiblePayBands: PayBandDetail[] = originalPayBands
    .filter(a => a.bandId === bandId && (a.startDate == null || parseISODate(a.startDate) <= startOfToday()))
    .sort(
      (a, b) =>
        (parseISODate(a.startDate) == null ? 0 : parseISODate(a.startDate).valueOf()) -
        (parseISODate(b.startDate) == null ? 0 : parseISODate(b.startDate).valueOf()),
    )

  const currentPayBand = possiblePayBands[possiblePayBands.length - 1]

  const futurePaybands: PayBandDetail[] = originalPayBands
    .filter(a => a.bandId === bandId && a.startDate != null && parseISODate(a.startDate) > startOfToday())
    .sort((a, b) => parseISODate(a.startDate).valueOf() - parseISODate(b.startDate).valueOf())

  if (futurePaybands.length > 0) {
    currentPayBand.description = `, set to change to ${toMoney(futurePaybands[0].rate)} from ${formatDate(parseISODate(futurePaybands[0].startDate))}`
  }

  return currentPayBand
}
