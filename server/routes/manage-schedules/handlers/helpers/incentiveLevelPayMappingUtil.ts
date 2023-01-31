import _ from 'lodash'
import PrisonService from '../../../../services/prisonService'
import { ServiceUser } from '../../../../@types/express'
import { Activity } from '../../../../@types/activitiesAPI/types'

type IepPay = {
  incentiveLevel: string
  pays: Array<{
    incentiveLevel: string
    prisonPayBand: {
      alias: string
    }
    rate: number
  }>
}

export default class IncentiveLevelPayMappingUtil {
  constructor(private readonly prisonService: PrisonService) {}

  async getPayGroupedByIncentiveLevel(activity: Activity, user: ServiceUser): Promise<IepPay[]> {
    const incentiveLevels = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)

    return _.chain(activity.pay)
      .groupBy('incentiveLevel')
      .map((value: unknown[], key: string) => ({
        incentiveLevel: key,
        pays: _.sortBy(value, 'displaySequence'),
        sequence: incentiveLevels.find(iep => iep.iepDescription === key).sequence,
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
  }
}
