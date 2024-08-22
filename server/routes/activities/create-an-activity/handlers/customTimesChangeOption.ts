import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export enum ScheduleChangeOption {
  DAYS_AND_SESSIONS = 'DAYS_AND_SESSIONS',
  START_END_TIMES = 'START_END_TIMES',
}

export class ScheduleOption {
  @Expose()
  @IsNotEmpty({ message: 'Select what you want to change in this activity’s schedule' })
  selectWhatYouWantToChange: ScheduleChangeOption
}

export default class CustomTimesChangeOptionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/activities/create-an-activity/custom-times-change-option`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const activity = await this.activitiesService.getActivity(+req.params.activityId, res.locals.user)
    const { usePrisonRegimeTime, scheduleWeeks } = activity.schedules[0]
    if (req.body.selectWhatYouWantToChange === ScheduleChangeOption.DAYS_AND_SESSIONS) {
      return res.redirect(`days-and-times/${scheduleWeeks}?preserveHistory=true`)
    }
    if (!usePrisonRegimeTime) return res.redirect('custom-times-change-default-or-custom')
    return res.redirect('session-times')
  }
}
