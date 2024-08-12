import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import getApplicableDaysAndSlotsInRegime, {
  ActivityDaysAndSlots,
} from '../../../../utils/helpers/applicableRegimeTimeUtil'

export class ActivityTimesOption {
  @Expose()
  @IsNotEmpty({ message: 'Select how to set the activity start and end times' })
  usePrisonRegimeTime: boolean
}

export default class ActivityTimesOptionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)

    // TODO: this will have to be passed through from previous pages once we do split regimes, rather than hardcoded
    const applicableRegimeTimesForActivity = getApplicableDaysAndSlotsInRegime(
      regimeTimes,
      req.session.createJourney.slots['1'] as ActivityDaysAndSlots,
    )

    res.render(`pages/activities/create-an-activity/activity-times-option`, {
      regimeTimes: applicableRegimeTimesForActivity,
    })
  }

  // TODO
  // eslint-disable-next-line no-empty-function, @typescript-eslint/no-unused-vars
  POST = async (req: Request, res: Response): Promise<void> => {}
}
