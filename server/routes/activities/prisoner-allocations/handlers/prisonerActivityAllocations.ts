import { Request, Response } from 'express'
import { IsNotEmpty } from 'class-validator'
import { Expose } from 'class-transformer'
import config from '../../../../config'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivitySummary } from '../../../../@types/activitiesAPI/types'
import { getScheduleIdFromActivity } from '../../../../utils/utils'

export class FromActivityList {
  @Expose()
  @IsNotEmpty({ message: 'Search for an activity and select it from the list' })
  activityId: string
}

export default class ActivityAllocationHandler {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    if (!config.prisonerAllocationsEnabled) {
      return res.redirect('/activities')
    }
    const { user } = res.locals

    const activities: ActivitySummary[] = await this.activitiesService.getActivities(true, user)

    return res.render('pages/activities/prisoner-allocations/activity-search', {
      activities,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber } = req.params
    const { activityId } = req.body

    const activity = await this.activitiesService.getActivity(activityId, user)
    const activityScheduleId = getScheduleIdFromActivity(activity)

    return res.redirect(`/activities/allocations/create/prisoner/${prisonerNumber}?scheduleId=${activityScheduleId}`)
  }
}
