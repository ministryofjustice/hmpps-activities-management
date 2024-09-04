import { Request, Response } from 'express'
import { IsNotEmpty } from 'class-validator'
import { Expose } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import getApplicableDaysAndSlotsInRegime from '../../../../utils/helpers/applicableRegimeTimeUtil'
import { Slots } from '../journey'

export class SessionTimesOption {
  @Expose()
  @IsNotEmpty({ message: 'Select how to set the activity start and end times' })
  usePrisonRegimeTime: string
}

export default class SessionTimesOptionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { weekNumber } = req.params
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)
    const applicableRegimeTimesForActivity = getApplicableDaysAndSlotsInRegime(
      regimeTimes,
      req.session.createJourney.slots[weekNumber] as Slots,
    )

    res.render(`pages/activities/create-an-activity/session-times-option`, {
      regimeTimes: applicableRegimeTimesForActivity,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { usePrisonRegimeTime } = req.body
    const { preserveHistory } = req.query

    if (usePrisonRegimeTime === 'true') {
      req.session.createJourney.customSlots = undefined
      if (preserveHistory === 'true') {
        return res.redirect('check-answers')
      }
      return res.redirectOrReturn('bank-holiday-option')
    }

    let redirectParams = ''
    if (preserveHistory === 'true') {
      redirectParams += '?preserveHistory=true'
    }

    return res.redirect(`../session-times${redirectParams}`)
  }
}
