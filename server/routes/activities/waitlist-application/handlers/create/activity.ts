import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { Min } from 'class-validator'
import ActivitiesService from '../../../../../services/activitiesService'
import { getScheduleIdFromActivity } from '../../../../../utils/utils'

export class Activity {
  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Search for an activity and select it from the list' })
  activityId: number
}

export default class ActivityRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const activities = await this.activitiesService
      .getActivities(true, user)
      .then(act => act.filter(a => a.category.code !== 'SAA_NOT_IN_WORK'))
      .then(act => act.map(a => ({ id: a.id, name: a.activityName })))

    return res.render(`pages/activities/waitlist-application/activity`, { activities })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { activityId } = req.body
    const { prisoner } = req.journeyData.waitListApplicationJourney
    const { user } = res.locals

    const activity = await this.activitiesService.getActivity(activityId, user)

    const alreadyAllocated =
      (await this.activitiesService
        .getActivePrisonPrisonerAllocations([prisoner.prisonerNumber], user)
        .then(alloc =>
          alloc.filter(all => all.allocations.find(a => a.scheduleId === getScheduleIdFromActivity(activity))),
        )
        .then(alloc => alloc.length > 0)) ||
      (await this.activitiesService
        .fetchActivityWaitlist(getScheduleIdFromActivity(activity), false, user)
        .then(waitlist => waitlist.filter(w => w.prisonerNumber === prisoner.prisonerNumber))
        .then(waitlist => waitlist.filter(w => w.status === 'PENDING' || w.status === 'APPROVED'))
        .then(alloc => alloc.length > 0))

    if (alreadyAllocated) {
      return res.validationFailed(
        'activityId',
        `${prisoner.name} is already allocated or on the waitlist for ${activity.description}`,
      )
    }

    req.journeyData.waitListApplicationJourney.activity = {
      activityId: activity.id,
      scheduleId: getScheduleIdFromActivity(activity),
      activityName: activity.description,
    }
    return res.redirectOrReturn(`requester`)
  }
}
