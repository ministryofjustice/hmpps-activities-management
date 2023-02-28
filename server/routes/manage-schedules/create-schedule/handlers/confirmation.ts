import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const scheduleId = +req.params.scheduleId
    const activityId = +req.params.id

    res.render('pages/manage-schedules/create-schedule/confirmation', { scheduleId, activityId })
    req.session.createScheduleJourney = null
  }
}
