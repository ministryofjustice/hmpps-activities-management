import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/manage-schedules/create-schedule/confirmation', { id: req.params.id as unknown as number })
    req.session.createScheduleJourney = null
  }
}
