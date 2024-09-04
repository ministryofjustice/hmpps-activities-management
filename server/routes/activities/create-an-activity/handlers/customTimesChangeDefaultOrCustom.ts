import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import getApplicableDaysAndSlotsInRegime from '../../../../utils/helpers/applicableRegimeTimeUtil'
import { Slots } from '../journey'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import { mapJourneySlotsToActivityRequest } from '../../../../utils/utils'

export enum DefaultOrCustomTimes {
  DEFAULT_PRISON_REGIME = 'DEFAULT_PRISON_REGIME',
  CUSTOM_START_END_TIMES = 'CUSTOM_START_END_TIMES',
}

export class DefaultOrCustomOption {
  @Expose()
  @IsNotEmpty({ message: 'Select how to change the activity start and end times' })
  selectHowToChangeTimes: DefaultOrCustomTimes
}

export default class CustomTimesChangeDefaultOrCustomRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { weekNumber } = req.params
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)

    const slots: Slots = req.session.createJourney.slots[weekNumber]
    const applicableRegimeTimesForActivity = getApplicableDaysAndSlotsInRegime(regimeTimes, slots)
    res.render(`pages/activities/create-an-activity/custom-times-change-default-or-custom`, {
      regimeTimes: applicableRegimeTimesForActivity,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId, name, scheduleWeeks } = req.session.createJourney

    if (req.body.selectHowToChangeTimes === DefaultOrCustomTimes.DEFAULT_PRISON_REGIME) {
      const slots = mapJourneySlotsToActivityRequest(req.session.createJourney.slots)

      const activity = {
        slots,
        scheduleWeeks,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(activityId, activity, user)
      const successMessage = `You've updated the daily schedule for ${name}`
      return res.redirectWithSuccess(`/activities/view/${activityId}`, 'Activity updated', successMessage)
    }

    return res.redirect('../session-times')
  }
}
