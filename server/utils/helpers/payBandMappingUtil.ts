import _, { forEach } from 'lodash'
import PrisonService from '../../services/prisonService'
import { ServiceUser } from '../../@types/express'
import { Prisoner } from '../../@types/prisonerOffenderSearchImport/types'
import { IncentiveLevel } from '../../@types/incentivesApi/types'
import { ActivityPay, Allocation } from '../../@types/activitiesAPI/types'

export type IepPay = {
  incentiveLevel: string
  pays: Array<ActivityPay & { allocationCount: number }>
}

export type IepPayDisplay = {
  incentiveLevel: string
  pays: Array<ActivityPay & { allocationCount: number; description?: string }>
}

export type DisplayPay = {
  allocationCount: number
  description: string
  payBandId: number
  id: number
  incentiveNomisCode: string
  incentiveLevel?: string
  prisonPayBand: {
    id: number
    displaySequence: number
    alias: string
    description: string
    nomisPayBand: number
    prisonCode: string
  }
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
