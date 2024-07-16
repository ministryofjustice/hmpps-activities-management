import _, { forEach } from 'lodash'
import { startOfToday } from 'date-fns'
import PrisonService from '../../services/prisonService'
import { ServiceUser } from '../../@types/express'
import { Prisoner } from '../../@types/prisonerOffenderSearchImport/types'
import { IncentiveLevel } from '../../@types/incentivesApi/types'
import { ActivityPay, Allocation, PrisonPayBand } from '../../@types/activitiesAPI/types'
import { parseISODate, toMoney } from '../utils'
import { isoDateToDatePickerDate } from '../datePickerUtils'

export type IepPay = {
  incentiveLevel: string
  pays: Array<ActivityPay & { allocationCount: number }>
}

export type IepPayDisplay = {
  incentiveLevel: string
  pays: DisplayPay[]
}

export type DisplayPay = {
  allocationCount: number
  description?: string
  id: number
  incentiveNomisCode: string
  incentiveLevel?: string
  prisonPayBand: PrisonPayBand
  rate?: number
  pieceRate?: number
  pieceRateItems?: number
  startDate?: string
}
export default class IncentiveLevelPayMappingUtil {
  constructor(private readonly prisonService: PrisonService) {}

  async getPayGroupedByIncentiveLevel(
    pay: ActivityPay[],
    allocations: Allocation[],
    user: ServiceUser,
  ): Promise<IepPay[]> {
    if (pay.length === 0) return []

    const allocationsMaybe = allocations || []

    const allocatedPrisonerNumbers = allocationsMaybe.map(a => a.prisonerNumber)
    const [allocatedPrisoners, incentiveLevels]: [Prisoner[], IncentiveLevel[]] = await Promise.all([
      this.prisonService.searchInmatesByPrisonerNumbers(allocatedPrisonerNumbers, user),
      this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user),
    ])

    return _.chain(pay)
      .groupBy('incentiveLevel')
      .map((value: ActivityPay[], key: string) => ({
        incentiveLevel: key,
        pays: _.sortBy(value, 'prisonPayBand.displaySequence', 'startDate'),
        sequence: incentiveLevels.findIndex(iep => iep.levelName === key),
      }))
      .sortBy('sequence')
      .map(
        iepPay =>
          ({
            incentiveLevel: iepPay.incentiveLevel,
            pays: iepPay.pays.map(p => ({
              ...p,
              allocationCount: allocationsMaybe.filter(
                a =>
                  a.prisonPayBand.id === p.prisonPayBand.id &&
                  allocatedPrisoners.find(ap => ap.prisonerNumber === a.prisonerNumber).currentIncentive?.level
                    .description === iepPay.incentiveLevel,
              ).length,
            })),
          }) as IepPay,
      )
      .value()
  }
}

export function groupPayBand(iepPay: IepPay[]): IepPayDisplay[] {
  const iepPayDisplays: IepPayDisplay[] = []
  iepPay.forEach(item => {
    const iepPayDisplay: IepPayDisplay = {
      incentiveLevel: item.incentiveLevel,
      pays: [],
    }

    // get distinct list of pay band IDs
    // iterate band Id list & call new function, push result to IEP display pays

    const uniquePayBandIds = item.pays
      .map(pay => pay.prisonPayBand.id)
      .filter((value, index, self) => self.indexOf(value) === index)

    uniquePayBandIds.forEach(i => {
      const pay = singleDisplayPayForPayBandId(item.pays, i)
      iepPayDisplay.pays.push(pay)
    })
    iepPayDisplays.push(iepPayDisplay)
  })

  return iepPayDisplays
}

function singleDisplayPayForPayBandId(input: DisplayPay[], payBandId: number): DisplayPay {
  const allForPayband = input.filter(a => a.prisonPayBand.id === payBandId)

  if (allForPayband.length === 1) {
    return allForPayband[0]
  }

  const currentPayband = input
    .filter(
      a => a.prisonPayBand.id === payBandId && (a.startDate == null || parseISODate(a.startDate) <= startOfToday()),
    )
    .sort(
      (a, b) =>
        (parseISODate(a.startDate) == null ? 0 : parseISODate(a.startDate).valueOf()) -
        (parseISODate(b.startDate) == null ? 0 : parseISODate(b.startDate).valueOf()),
    )
    .pop()

  const futurePaybands = input
    .filter(a => a.prisonPayBand.id === payBandId && a.startDate != null && parseISODate(a.startDate) > startOfToday())
    .sort((a, b) => parseISODate(a.startDate).valueOf() - parseISODate(b.startDate).valueOf())

  if (futurePaybands.length > 0) {
    currentPayband.description = `, set to change to ${toMoney(futurePaybands[0].rate)} from ${isoDateToDatePickerDate(futurePaybands[0].startDate)}`
  }
  return currentPayband
}
