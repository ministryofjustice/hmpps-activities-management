import _ from 'lodash'
import PrisonService from '../../../services/prisonService'
import { ServiceUser } from '../../../@types/express'
import { CreateAnActivityJourney } from '../create-an-activity/journey'

type IepPay = {
  incentiveLevel: string
  pays: Array<{
    incentiveLevel: string
    bandId: number
    bandAlias: string
    rate: number
  }>
}

export default class IncentiveLevelPayMappingUtil {
  constructor(private readonly prisonService: PrisonService) {}

  async getPayGroupedByIncentiveLevel(pay: CreateAnActivityJourney['pay'], user: ServiceUser): Promise<IepPay[]> {
    const incentiveLevels = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)
    if (pay.length === 0) return []
    return _.chain(pay)
      .groupBy('incentiveLevel')
      .map((value: unknown[], key: string) => ({
        incentiveLevel: key,
        pays: _.sortBy(value, 'displaySequence'),
        sequence: incentiveLevels.findIndex(iep => iep.levelName === key),
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
