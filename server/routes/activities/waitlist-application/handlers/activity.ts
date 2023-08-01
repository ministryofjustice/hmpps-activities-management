import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { Min } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'

export class Activity {
  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Select an activity' })
  activityId: number
}

export default class ActivityRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const activities = await this.activitiesService
      .getActivities(true, user)
      .then(act => act.filter(a => a.category.code !== 'SAA_NOT_IN_WORK'))
      .then(act => act.map(a => ({ id: a.id, name: a.description })))

    return res.render(`pages/activities/waitlist-application/activity`, { activities })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { activityId } = req.body
    const { prisoner } = req.session.waitListApplicationJourney
    const { user } = res.locals

    const activity = await this.activitiesService.getActivity(activityId, user)

    const alreadyAllocated = await this.activitiesService
      .getActivePrisonPrisonerAllocations([prisoner.prisonerNumber], user)
      .then(alloc => alloc.filter(all => all.allocations.find(a => a.scheduleId === activity.id)))
      .then(alloc => alloc.length > 0)

    if (alreadyAllocated) {
      return res.validationFailed(
        'activityId',
        `${prisoner.name} is already allocated or on the waitlist for ${activity.description}`,
      )
    }

    req.session.waitListApplicationJourney.activity = {
      activityId: activity.id,
      activityName: activity.description,
    }
    return res.redirectOrReturn(`requester`)
  }
}
