import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const scheduleId = +req.params.scheduleId

    res.render('pages/manage-schedules/create-schedule/confirmation', { scheduleId, activity: res.locals.activity })
    req.session.createScheduleJourney = null
  }
}
