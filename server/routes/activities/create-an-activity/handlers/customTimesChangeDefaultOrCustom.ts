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

export default class customTimesChangeDefaultOrCustomRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)

    // TODO: the week will have to be passed through from previous pages once we do split regimes, rather than hardcoded as ['1']
    const slots: Slots = req.session.createJourney.slots['1']
    const applicableRegimeTimesForActivity = getApplicableDaysAndSlotsInRegime(regimeTimes, slots)
    res.render(`pages/activities/create-an-activity/custom-times-change-default-or-custom`, {
      regimeTimes: applicableRegimeTimesForActivity,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId, name } = req.session.createJourney
    const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)

    if (req.body.selectHowToChangeTimes === DefaultOrCustomTimes.DEFAULT_PRISON_REGIME) {
      console.log(regimeTimes)
      //  regime times need to be converted tolook like Slot[]


      // const slots = mapJourneySlotsToActivityRequest(regimeTimes)

      // const activity = { slots } as ActivityUpdateRequest
      // await this.activitiesService.updateActivity(activityId, activity, user)

      // const successMessage = `You've updated the daily schedule for ${name}`
      // return res.redirectWithSuccess(`/activities/view/${activityId}`, 'Activity updated', successMessage)
    }

    // if the user wants to select the start and end times to change, go to sessionTimes page? Need to introduce edit mode to that page maybe?
    return res.redirect('session-times')
  }
}
