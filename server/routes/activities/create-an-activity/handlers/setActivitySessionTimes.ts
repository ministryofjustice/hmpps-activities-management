import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import getApplicableDaysAndSlotsInRegime, {
  ActivityDaysAndSlots,
} from '../../../../utils/helpers/applicableRegimeTimeUtil'

export class ActivitySessionTimes {
  @Expose()
  @IsNotEmpty({ message: 'Select how to set the activity start and end times' })
  usePrisonRegimeTime: boolean
}

export default class ActivitySessionTimesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)

    const applicableRegimeTimesForActivity = getApplicableDaysAndSlotsInRegime(
      regimeTimes,
      // TODO: the week will have to be passed through from previous pages once we do split regimes, rather than hardcoded as ['1']
      req.session.createJourney.slots['1'] as ActivityDaysAndSlots,
    )

    res.render(`pages/activities/create-an-activity/activity-session-times`, {
      regimeTimes: applicableRegimeTimesForActivity,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // const { user } = res.locals
    // const { preserveHistory } = req.query
    // const { activityId } = req.session.createJourney
    // const customTimesPage = `pages/activities/create-an-activity/custom-activity-times-page`
    // if (usePrisonRegimeTime) {
    //   res.redirectOrReturn('location')
    // } else res.redirectOrReturn(customTimesPage)
  }
}
