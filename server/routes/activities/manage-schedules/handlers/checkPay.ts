import { Request, Response } from 'express'
import PrisonService from '../../../../services/prisonService'
import IncentiveLevelPayMappingUtil from './helpers/incentiveLevelPayMappingUtil'
import ActivitiesService from '../../../../services/activitiesService'

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

    res.render(`pages/activities/manage-schedules/check-pay`, { incentiveLevelPays, flatPay })
  }
}
