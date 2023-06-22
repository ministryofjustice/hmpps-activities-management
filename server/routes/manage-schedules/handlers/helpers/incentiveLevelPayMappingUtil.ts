import _ from 'lodash'
import PrisonService from '../../../../services/prisonService'
import { ServiceUser } from '../../../../@types/express'
import { Activity } from '../../../../@types/activitiesAPI/types'

type IepPay = {
  incentiveLevel: string
  pays: Array<{
    incentiveLevel: string
    bandId: number
    bandAlias: string
    rate: number
    peopleCount: number
  }>
}

export default class IncentiveLevelPayMappingUtil {
  constructor(private readonly prisonService: PrisonService) {}

  async getPayGroupedByIncentiveLevel(
    pay: {
      incentiveNomisCode: string
      incentiveLevel: string
      bandId: number
      bandAlias: string
      displaySequence: number
      rate: number
    }[],
    user: ServiceUser,
    activity: Activity,
  ): Promise<IepPay[]> {
    const incentiveLevels = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)

    const iepPayArray = _.chain(pay)
      .groupBy('incentiveLevel')
      .map((value: unknown[], key: string) => ({
        incentiveLevel: key,
        pays: _.sortBy(value, 'displaySequence'),
        sequence: incentiveLevels.find(iep => iep.iepDescription === key)?.sequence,
      }))
      .sortBy('sequence')
      .map(
        iepPay =>
          ({
            incentiveLevel: iepPay.incentiveLevel,
            pays: iepPay.pays,
          } as IepPay),
      )
      .value()

    const prisonerNumbers: string[] = []
    activity.schedules.forEach(schedule => {
      schedule.allocations.forEach(allocation => {
        prisonerNumbers.push(allocation.prisonerNumber)
      })
    })

    if (prisonerNumbers.length > 0) {
      const inmates = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

      const iepPayArrayOut: IepPay[] = []
      iepPayArray.forEach(incentiveLevelPay => {
        const paysWithCount: {
          incentiveLevel: string
          bandId: number
          bandAlias: string
          rate: number
          peopleCount: number
        }[] = []
        incentiveLevelPay.pays.forEach(payBand => {
          activity.schedules.forEach(schedule => {
            let peopleCount = 0
            const allocationsForPayBand = schedule.allocations.filter(
              allocation => allocation.prisonPayBand.id === payBand.bandId,
            )
            allocationsForPayBand.forEach(allocation => {
              peopleCount += inmates.filter(
                inmate =>
                  inmate.prisonerNumber === allocation.prisonerNumber &&
                  inmate.currentIncentive.level.description === incentiveLevelPay.incentiveLevel,
              ).length
            })
            paysWithCount.push({
              incentiveLevel: incentiveLevelPay.incentiveLevel,
              bandId: payBand.bandId,
              bandAlias: payBand.bandAlias,
              rate: payBand.rate,
              peopleCount,
            })
          })
        })
        iepPayArrayOut.push({
          incentiveLevel: incentiveLevelPay.incentiveLevel,
          pays: paysWithCount,
        })
      })

      return iepPayArrayOut
    }
    return iepPayArray
  }
}
