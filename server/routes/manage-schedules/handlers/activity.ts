import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import IncentiveLevelPayMappingUtil from './helpers/incentiveLevelPayMappingUtil'
import PrisonService from '../../../services/prisonService'

export default class ActivityRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId } = req.params

    const activity = await this.activitiesService.getActivity(activityId as unknown as number, user)
    const incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(activity, user)

    res.render('pages/manage-schedules/view-activity', {
      activity,
      incentiveLevelPays,
    })
  }
}
