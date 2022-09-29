import { Request, Response } from 'express'

export default class ActivityListRouteHandler {
  GET = async (req: Request, res: Response): Promise<void> => {
    const viewContext = {}
    res.render('pages/activity-list/index', viewContext)
  }
}
