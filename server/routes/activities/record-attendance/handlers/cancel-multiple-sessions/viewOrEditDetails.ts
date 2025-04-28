import { Request, Response } from 'express'
import { startOfDay, startOfToday } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import { toDate } from '../../../../../utils/utils'
import UserService from '../../../../../services/userService'

export default class CancelMultipleSessionsViewEditDetailsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly userService: UserService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const instanceId = +req.params.id
    const { user } = res.locals

    const instance = await this.activitiesService.getScheduledActivity(instanceId, user).then(i => ({
      ...i,
      isAmendable: startOfDay(toDate(i.date)) >= startOfToday(),
    }))

    const userMap = await this.userService.getUserMap([instance.cancelledBy], user)
    const isPayable = instance.activitySchedule.activity.paid

    res.render('pages/activities/record-attendance/cancel-multiple-sessions/view-cancellation-details', {
      instance,
      userMap,
      isPayable,
    })
  }
}
