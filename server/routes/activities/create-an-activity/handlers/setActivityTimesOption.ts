import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import getApplicableDaysAndSlotsInRegime, {
  ActivityDaysAndSlots,
} from '../../../../utils/helpers/applicableRegimeTimeUtil'

export class ActivityTimesOption {}

export default class ActivityTimesOptionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)

    const applicableRegimeTimesForActivity = getApplicableDaysAndSlotsInRegime(
      regimeTimes,
      // TODO: the week will have to be passed through from previous pages once we do split regimes, rather than hardcoded as ['1']
      req.session.createJourney.slots['1'] as ActivityDaysAndSlots,
    )

    res.render(`pages/activities/create-an-activity/activity-times-option`, {
      regimeTimes: applicableRegimeTimesForActivity,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { preserveHistory } = req.query
    const { activityId } = req.session.createJourney
    const { usePrisonRegimeTime } = req.body
    if (usePrisonRegimeTime === 'true') {
      res.redirectOrReturn('location')
    } else res.redirectOrReturn(`activity-session-times`)
  }
}
