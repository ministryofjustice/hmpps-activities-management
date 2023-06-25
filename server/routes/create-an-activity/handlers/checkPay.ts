import { Request, Response } from 'express'
import PrisonService from '../../../services/prisonService'
import IncentiveLevelPayMappingUtil from './helpers/incentiveLevelPayMappingUtil'
import { ActivityUpdateRequest } from '../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../services/activitiesService'

export default class CheckPayRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    let incentiveLevelPays = []
    incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(req, user)
    const flatPay = req.session.createJourney.flat

    res.render(`pages/create-an-activity/check-pay`, { incentiveLevelPays, flatPay })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { pay, flat } = req.session.createJourney

    if (pay.length === 0 && flat.length === 0) {
      return res.validationFailed('', `Add at least one pay rate`)
    }

    const minimumIncentiveLevel = await this.prisonService
      .getIncentiveLevels(user.activeCaseLoadId, user)
      .then(levels => levels.find(l => pay.find(p => p.incentiveLevel === l.levelName) || flat.length))

    req.session.createJourney.minimumIncentiveNomisCode = minimumIncentiveLevel.levelCode
    req.session.createJourney.minimumIncentiveLevel = minimumIncentiveLevel.levelName

    if (req.query && req.query.fromEditActivity) {
      const { activityId } = req.session.createJourney
      const prisonCode = user.activeCaseLoadId
      const activity = {
        pay: req.session.createJourney.pay.map(p => ({
          incentiveNomisCode: p.incentiveNomisCode,
          incentiveLevel: p.incentiveLevel,
          payBandId: p.bandId,
          rate: p.rate,
        })),
      } as ActivityUpdateRequest

      if (req.session.createJourney.flat && req.session.createJourney.flat.length > 0) {
        const incentiveLevels = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)

        req.session.createJourney.flat.forEach(flatRate => {
          incentiveLevels.forEach(iep =>
            activity.pay.push({
              incentiveNomisCode: iep.levelCode,
              incentiveLevel: iep.levelName,
              payBandId: flatRate.bandId,
              rate: flatRate.rate,
            }),
          )
        })
      }

      await this.activitiesService.updateActivity(prisonCode, activityId, activity)
      const successMessage = `We've updated the pay for ${req.session.createJourney.name}`

      const returnTo = `/activities/schedule/activities/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      return res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    }

    return res.redirectOrReturn(`qualification`)
  }
}
