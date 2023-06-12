import { Request, Response } from 'express'
import _ from 'lodash'
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

    const { activityId, pay } = req.session.createJourney
    const activity = await this.activitiesService.getActivity(activityId, user)
    const incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(pay, user, activity)
    const flatPay = req.session.createJourney.flat

    res.render(`pages/manage-schedules/check-pay`, { incentiveLevelPays, flatPay })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { pay, flat } = req.session.createJourney

    if (pay.length === 0 && flat.length === 0) {
      return res.validationFailed('', `Add at least one pay rate`)
    }

    const minimumIncentiveLevel = await this.prisonService
      .getIncentiveLevels(user.activeCaseLoadId, user)
      .then(levels => _.sortBy(levels, 'sequence'))
      .then(levels => {
        if (pay.length === 0) return levels[0]
        return levels.find(l => pay.find(p => p.incentiveLevel === l.iepDescription))
      })

    req.session.createJourney.minimumIncentiveNomisCode = minimumIncentiveLevel.iepLevel
    req.session.createJourney.minimumIncentiveLevel = minimumIncentiveLevel.iepDescription

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
            incentiveNomisCode: iep.iepLevel,
            incentiveLevel: iep.iepDescription,
            payBandId: flatRate.bandId,
            rate: flatRate.rate,
          }),
        )
      })
    }

    await this.activitiesService.updateActivity(prisonCode, activityId, activity)
    const successMessage = `We've updated the pay for ${req.session.createJourney.name}`

    const returnTo = `/schedule/activities/${req.session.createJourney.activityId}`
    req.session.returnTo = returnTo
    return res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
  }
}
