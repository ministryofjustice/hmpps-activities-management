import { Request, Response } from 'express'
import { IsNotEmpty } from 'class-validator'
import { Expose } from 'class-transformer'
import { Slots } from '../journey'
import ActivitiesService from '../../../../services/activitiesService'
import BankHolidayService from '../../../../services/bankHolidayService'
import getApplicableDaysAndSlotsInRegime from '../../../../utils/helpers/applicableRegimeTimeUtil'
import ActivityDateValidator from '../../../../utils/helpers/activityDateValidator'

export class SessionTimesOption {
  @Expose()
  @IsNotEmpty({ message: 'Select how to set the activity start and end times' })
  usePrisonRegimeTime: string
}

export default class SessionTimesOptionRoutes {
  private readonly helper: ActivityDateValidator

  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly bankHolidayService: BankHolidayService,
  ) {
    this.helper = new ActivityDateValidator(bankHolidayService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { weekNumber } = req.params
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)
    const applicableRegimeTimesForActivity = getApplicableDaysAndSlotsInRegime(
      regimeTimes,
      req.journeyData.createJourney.slots[weekNumber] as Slots,
    )

    res.render(`pages/activities/create-an-activity/session-times-option`, {
      regimeTimes: applicableRegimeTimesForActivity,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { usePrisonRegimeTime } = req.body
    const { preserveHistory } = req.query
    const { createJourney } = req.journeyData

    createJourney.hasAtLeastOneValidDay = await this.helper.hasAtLeastOneValidDay(createJourney, res.locals.user)

    if (usePrisonRegimeTime === 'true') {
      createJourney.customSlots = undefined
      if (preserveHistory === 'true') {
        return res.redirect('../check-answers')
      }

      if (createJourney.hasAtLeastOneValidDay) {
        return res.redirectOrReturn('../bank-holiday-option')
      }
      createJourney.runsOnBankHoliday = true

      // If the location has already been set, skip the location page
      if (createJourney.inCell) return res.redirectOrReturn('../capacity')
      return res.redirectOrReturn('../location')
    }

    let redirectParams = ''
    if (preserveHistory === 'true') {
      redirectParams += '?preserveHistory=true'
    }

    return res.redirect(`../session-times${redirectParams}`)
  }
}
