import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export default class ConfirmationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const scheduleId = +req.params.scheduleId

    res.render('pages/manage-schedules/create-schedule/confirmation', { scheduleId, activity: res.locals.activity })
    req.session.createScheduleJourney = null
  }
}
