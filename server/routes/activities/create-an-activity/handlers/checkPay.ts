import { Request, Response } from 'express'
import PrisonService from '../../../../services/prisonService'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import IncentiveLevelPayMappingUtil from '../../../../utils/helpers/incentiveLevelPayMappingUtil'

export default class CheckPayRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { createJourney } = req.session
    const incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(
      createJourney.pay,
      createJourney.allocations,
      user,
    )
    const flatPay = req.session.createJourney.flat

    if (req.params.mode === 'edit') {
      res.render(`pages/activities/create-an-activity/edit-pay`, { incentiveLevelPays, flatPay })
    } else {
      res.render(`pages/activities/create-an-activity/check-pay`, { incentiveLevelPays, flatPay })
    }
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

    if (req.params.mode === 'edit') {
      const { activityId } = req.session.createJourney
      const prisonCode = user.activeCaseLoadId
      const activity = {
        pay: req.session.createJourney.pay.map(p => ({
          incentiveNomisCode: p.incentiveNomisCode,
          incentiveLevel: p.incentiveLevel,
          payBandId: p.prisonPayBand.id,
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
              payBandId: flatRate.prisonPayBand.id,
              rate: flatRate.rate,
            }),
          )
        })
      }

      await this.activitiesService.updateActivity(prisonCode, activityId, activity)
      const successMessage = `You've updated the pay for ${req.session.createJourney.name}`

      const returnTo = `/activities/view/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      return res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    }

    return res.redirectOrReturn(`qualification`)
  }
}
