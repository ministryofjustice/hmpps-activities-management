import { Request, Response } from 'express'

export default class ActivitiesDashboardRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/dashboard')
  }
}
