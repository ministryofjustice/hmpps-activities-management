import { Request, Response } from 'express'
import { IsNotEmpty } from 'class-validator'
import { Expose } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import getApplicableDaysAndSlotsInRegime from '../../../../utils/helpers/applicableRegimeTimeUtil'
import { Slots } from '../journey'

export class SessionTimesOption {
  @Expose()
  @IsNotEmpty({ message: 'Select how the to set the activity start and end times' })
  usePrisonRegimeTime: string
}

export default class SessionTimesOptionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)

    const applicableRegimeTimesForActivity = getApplicableDaysAndSlotsInRegime(
      regimeTimes,
      // TODO: the week will have to be passed through from previous pages once we do split regimes, rather than hardcoded as ['1']
      req.session.createJourney.slots['1'] as Slots,
    )

    res.render(`pages/activities/create-an-activity/session-times-option`, {
      regimeTimes: applicableRegimeTimesForActivity,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { usePrisonRegimeTime } = req.body
    if (usePrisonRegimeTime === 'true') {
      res.redirectOrReturn('location')
    } else res.redirectOrReturn(`session-times`)
  }
}