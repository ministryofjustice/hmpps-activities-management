import { Request } from 'express'
import _ from 'lodash'
import PrisonService from '../../../../services/prisonService'
import { ServiceUser } from '../../../../@types/express'

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

  async getPayGroupedByIncentiveLevel(req: Request, user: ServiceUser): Promise<IepPay[]> {
    const incentiveLevels = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)
    if (req.session.createJourney.pay.length > 0) {
      return _.chain(req.session.createJourney.pay)
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

    return []
  }
}
