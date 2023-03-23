import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import IncentiveLevelPayMappingUtil from './helpers/incentiveLevelPayMappingUtil'
import PrisonService from '../../../services/prisonService'
import scheduleSlotsToDayMapper from '../../../utils/helpers/scheduleSlotsToDayMapper'

export default class ActivityRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const activityId = +req.params.activityId

    const activity = await this.activitiesService.getActivity(activityId, user)

    const [incentiveLevelPays, schedule] = await Promise.all([
      this.helper.getPayGroupedByIncentiveLevel(activity, user),
      this.activitiesService.getDefaultScheduleOfActivity(activity, user).then(s => ({
        ...s,
        dailySlots: scheduleSlotsToDayMapper(s.slots),
      })),
    ])

    res.render('pages/manage-schedules/view-activity', {
      activity,
      schedule,
      incentiveLevelPays,
    })
  }
}
